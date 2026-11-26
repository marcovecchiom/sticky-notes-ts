import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_COLOR, MIN_HEIGHT, MIN_WIDTH } from '../constants/notes'
import { SYNC_DEBOUNCE_MS } from '../constants/storage'
import { syncNotes } from '../services/mockApiService'
import { loadNotesFromStorage, saveNotesToStorage } from '../services/storageService'
import type { Dimensions, Note, NoteColor, Position } from '../types/note'
import type { SyncStatus } from '../types/sync'

type NoteChanges = Partial<Omit<Note, 'id'>>

/**
 * Finds the highest stacking order on the board.
 *
 * @param {Note[]} notes - Current notes.
 * @returns {number} The highest `zIndex`, or `0` when there are no notes.
 */
function getMaxZIndex(notes: Note[]): number {
  return notes.reduce((max, note) => Math.max(max, note.zIndex), 0)
}

/**
 * Applies changes to one note immutably. Untouched notes keep their object identity
 * so memoized components skip re-rendering.
 *
 * @param {Note[]} notes - Current notes.
 * @param {string} id - Id of the note to update.
 * @param {NoteChanges} changes - Fields to overwrite.
 * @returns {Note[]} A new array with the updated note.
 */
function updateNote(notes: Note[], id: string, changes: NoteChanges): Note[] {
  return notes.map((note) => (note.id === id ? { ...note, ...changes } : note))
}

/**
 * Central store for the board: holds the notes, exposes stable CRUD actions and
 * syncs every change to `localStorage` and the mock API after a debounce.
 *
 * @returns {object} The notes, the current `SyncStatus` and the actions
 * (`addNote`, `bringToFront`, `updateNotePosition`, `updateNoteSize`,
 * `updateNoteText`, `updateNoteColor`, `deleteNote`).
 */
export function useNotesManager() {
  const [notes, setNotes] = useState<Note[]>(loadNotesFromStorage)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const persistedNotesRef = useRef(notes)
  const latestNotesRef = useRef(notes)
  const syncRequestIdRef = useRef(0)

  useEffect(() => {
    latestNotesRef.current = notes
    if (notes === persistedNotesRef.current) return

    setSyncStatus('saving')
    const timeoutId = setTimeout(() => {
      persistedNotesRef.current = notes
      const savedLocally = saveNotesToStorage(notes)
      const requestId = ++syncRequestIdRef.current

      syncNotes(notes)
        .then(() => savedLocally)
        .catch(() => false)
        .then((succeeded) => {
          // A newer sync has started; its result is the one that matters.
          if (requestId !== syncRequestIdRef.current) return
          setSyncStatus(succeeded ? 'saved' : 'error')
        })
    }, SYNC_DEBOUNCE_MS)

    return () => clearTimeout(timeoutId)
  }, [notes])

  // Flushes changes still waiting for the debounce when the tab is closed.
  useEffect(() => {
    const flush = () => {
      if (latestNotesRef.current !== persistedNotesRef.current) {
        saveNotesToStorage(latestNotesRef.current)
      }
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [])

  /**
   * Creates a note on top of the others, enforcing the minimum size.
   *
   * @param {Position & Dimensions} bounds - Requested position and size.
   * @param {NoteColor} [color=DEFAULT_COLOR] - Background color.
   * @returns {string} The id of the new note.
   */
  const addNote = useCallback((bounds: Position & Dimensions, color: NoteColor = DEFAULT_COLOR): string => {
    const id = crypto.randomUUID()
    setNotes((prev) => [
      ...prev,
      {
        id,
        x: Math.max(0, bounds.x),
        y: Math.max(0, bounds.y),
        width: Math.max(MIN_WIDTH, bounds.width),
        height: Math.max(MIN_HEIGHT, bounds.height),
        text: '',
        color,
        zIndex: getMaxZIndex(prev) + 1,
      },
    ])
    return id
  }, [])

  /**
   * Moves a note above all others. Does nothing if it is already on top.
   *
   * @param {string} id - Id of the note.
   * @returns {void}
   */
  const bringToFront = useCallback((id: string) => {
    setNotes((prev) => {
      const target = prev.find((note) => note.id === id)
      const maxZIndex = getMaxZIndex(prev)
      if (!target || target.zIndex === maxZIndex) return prev
      return updateNote(prev, id, { zIndex: maxZIndex + 1 })
    })
  }, [])

  /**
   * Moves a note, keeping it inside the top and left edges.
   *
   * @param {string} id - Id of the note.
   * @param {Position} position - New top-left corner.
   * @returns {void}
   */
  const updateNotePosition = useCallback((id: string, position: Position) => {
    setNotes((prev) => updateNote(prev, id, { x: Math.max(0, position.x), y: Math.max(0, position.y) }))
  }, [])

  /**
   * Resizes a note, never below `MIN_WIDTH` x `MIN_HEIGHT`.
   *
   * @param {string} id - Id of the note.
   * @param {Dimensions} dimensions - New size.
   * @returns {void}
   */
  const updateNoteSize = useCallback((id: string, dimensions: Dimensions) => {
    setNotes((prev) =>
      updateNote(prev, id, {
        width: Math.max(MIN_WIDTH, dimensions.width),
        height: Math.max(MIN_HEIGHT, dimensions.height),
      }),
    )
  }, [])

  /**
   * Replaces the text of a note.
   *
   * @param {string} id - Id of the note.
   * @param {string} text - New content.
   * @returns {void}
   */
  const updateNoteText = useCallback((id: string, text: string) => {
    setNotes((prev) => updateNote(prev, id, { text }))
  }, [])

  /**
   * Changes the background color of a note.
   *
   * @param {string} id - Id of the note.
   * @param {NoteColor} color - New color.
   * @returns {void}
   */
  const updateNoteColor = useCallback((id: string, color: NoteColor) => {
    setNotes((prev) => updateNote(prev, id, { color }))
  }, [])

  /**
   * Removes a note from the board.
   *
   * @param {string} id - Id of the note.
   * @returns {void}
   */
  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))
  }, [])

  return {
    notes,
    syncStatus,
    addNote,
    bringToFront,
    updateNotePosition,
    updateNoteSize,
    updateNoteText,
    updateNoteColor,
    deleteNote,
  }
}
