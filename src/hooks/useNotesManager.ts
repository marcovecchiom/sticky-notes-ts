import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_COLOR, MIN_HEIGHT, MIN_WIDTH } from '../constants/notes'
import { SYNC_DEBOUNCE_MS } from '../constants/storage'
import { syncNotes } from '../services/mockApiService'
import { loadNotesFromStorage, saveNotesToStorage } from '../services/storageService'
import type { Dimensions, Note, NoteColor, Position, Rect } from '../types/note'
import type { SyncStatus } from '../types/sync'

type NoteChanges = Partial<Omit<Note, 'id'>>

function getMaxZIndex(notes: Note[]): number {
  return notes.reduce((max, note) => Math.max(max, note.zIndex), 0)
}

/** Untouched notes keep their object identity so memoized components skip re-rendering. */
function updateNote(notes: Note[], id: string, changes: NoteChanges): Note[] {
  return notes.map((note) => (note.id === id ? { ...note, ...changes } : note))
}

/**
 * Single source of truth for the board. Changes are persisted after a debounce so
 * continuous gestures (dozens of updates per second) do not flood storage or the API.
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

  const addNote = useCallback((bounds: Rect, color: NoteColor = DEFAULT_COLOR): string => {
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

  /** No-op when the note is already on top, avoiding a re-render and a sync. */
  const bringToFront = useCallback((id: string) => {
    setNotes((prev) => {
      const target = prev.find((note) => note.id === id)
      const maxZIndex = getMaxZIndex(prev)
      if (!target || target.zIndex === maxZIndex) return prev
      return updateNote(prev, id, { zIndex: maxZIndex + 1 })
    })
  }, [])

  const updateNotePosition = useCallback((id: string, position: Position) => {
    setNotes((prev) => updateNote(prev, id, { x: Math.max(0, position.x), y: Math.max(0, position.y) }))
  }, [])

  const updateNoteSize = useCallback((id: string, dimensions: Dimensions) => {
    setNotes((prev) =>
      updateNote(prev, id, {
        width: Math.max(MIN_WIDTH, dimensions.width),
        height: Math.max(MIN_HEIGHT, dimensions.height),
      }),
    )
  }, [])

  const updateNoteText = useCallback((id: string, text: string) => {
    setNotes((prev) => updateNote(prev, id, { text }))
  }, [])

  const updateNoteColor = useCallback((id: string, color: NoteColor) => {
    setNotes((prev) => updateNote(prev, id, { color }))
  }, [])

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
