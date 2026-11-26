import { useCallback, useEffect, useRef } from 'react'
import type { KeyboardEvent, RefObject } from 'react'
import { NEW_NOTE_BUTTON_ID } from '../constants/a11y'
import { KEYBOARD_STEP, MIN_HEIGHT, MIN_WIDTH } from '../constants/notes'
import type { Announce } from '../types/announcement'
import type { Dimensions, Note, Position } from '../types/note'
import { clamp } from '../utils/geometry'

/**
 * Dependencies of `useNoteKeyboard`: the current notes, the board element, the
 * store actions and the screen reader announcer.
 */
interface NoteKeyboardOptions {
  notes: Note[]
  boardRef: RefObject<HTMLElement | null>
  bringToFront: (id: string) => void
  updateNotePosition: (id: string, position: Position) => void
  updateNoteSize: (id: string, dimensions: Dimensions) => void
  deleteNote: (id: string) => void
  announce: Announce
}

const ARROW_DIRECTIONS: Record<string, Position> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
}

/**
 * Keyboard alternative to the pointer gestures: arrow keys move a note, Shift + arrow
 * keys resize it and Delete/Backspace removes it, keeping focus on a sensible element.
 *
 * @param {NoteKeyboardOptions} options - Notes, board ref, store actions and announcer.
 * @returns {object} Stable `handleNoteKeyDown` and `deleteNoteAndMoveFocus` callbacks.
 */
export function useNoteKeyboard({
  notes,
  boardRef,
  bringToFront,
  updateNotePosition,
  updateNoteSize,
  deleteNote,
  announce,
}: NoteKeyboardOptions) {
  const notesRef = useRef(notes)
  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  /**
   * Deletes a note. If focus was inside it, focus moves to the previous note, the
   * next one, or the "New Note" button, so it is never lost on `document.body`.
   *
   * @param {string} noteId - Id of the note to delete.
   * @returns {void}
   */
  const deleteNoteAndMoveFocus = useCallback(
    (noteId: string) => {
      const noteElements = Array.from(boardRef.current?.querySelectorAll<HTMLElement>('[data-note-id]') ?? [])
      const index = noteElements.findIndex((element) => element.dataset.noteId === noteId)
      if (noteElements[index]?.contains(document.activeElement)) {
        const nextFocus =
          noteElements[index - 1] ?? noteElements[index + 1] ?? document.getElementById(NEW_NOTE_BUTTON_ID)
        nextFocus?.focus()
      }
      deleteNote(noteId)
      announce('Sticky note deleted')
    },
    [announce, boardRef, deleteNote],
  )

  /**
   * Runs the keyboard command for a focused note, within the board bounds.
   *
   * @param {KeyboardEvent<HTMLElement>} event - `keydown` on the note card.
   * @param {string} noteId - Id of the focused note.
   * @returns {void}
   */
  const handleNoteKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, noteId: string) => {
      const note = notesRef.current.find((candidate) => candidate.id === noteId)
      const board = boardRef.current
      if (!note || !board) return

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        deleteNoteAndMoveFocus(noteId)
        return
      }

      const direction = ARROW_DIRECTIONS[event.key]
      if (!direction) return
      event.preventDefault()
      bringToFront(noteId)

      if (event.shiftKey) {
        const width = clamp(note.width + direction.x * KEYBOARD_STEP, MIN_WIDTH, board.clientWidth - note.x)
        const height = clamp(note.height + direction.y * KEYBOARD_STEP, MIN_HEIGHT, board.clientHeight - note.y)
        updateNoteSize(noteId, { width, height })
        announce(`Resized to ${Math.round(width)} by ${Math.round(height)} pixels`)
      } else {
        const x = clamp(note.x + direction.x * KEYBOARD_STEP, 0, board.clientWidth - note.width)
        const y = clamp(note.y + direction.y * KEYBOARD_STEP, 0, board.clientHeight - note.height)
        updateNotePosition(noteId, { x, y })
        announce(`Moved to X ${Math.round(x)}, Y ${Math.round(y)}`)
      }
    },
    [announce, boardRef, bringToFront, deleteNoteAndMoveFocus, updateNotePosition, updateNoteSize],
  )

  return { handleNoteKeyDown, deleteNoteAndMoveFocus }
}
