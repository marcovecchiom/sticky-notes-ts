import { useCallback, useEffect, useRef } from 'react'
import type { KeyboardEvent, RefObject } from 'react'
import { NEW_NOTE_BUTTON_ID } from '../constants/a11y'
import { KEYBOARD_STEP } from '../constants/notes'
import type { Announce } from '../types/announcement'
import type { Dimensions, Note, Position, Rect } from '../types/note'
import { clampToBoard, constrainSize, getElementSize, getTrashRect, placeInBoard, rectsIntersect } from '../utils/geometry'

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
 * Unlike a drag, a keyboard step never deletes: a note heading into the trash zone stops at
 * its edge, so a held arrow key cannot remove a note by accident.
 */
function getKeyboardTarget(note: Rect, position: Position, direction: Position, board: Dimensions): Position {
  const target = clampToBoard(
    { ...note, x: position.x + direction.x * KEYBOARD_STEP, y: position.y + direction.y * KEYBOARD_STEP },
    board,
  )
  const trash = getTrashRect(board)
  if (!rectsIntersect({ ...note, ...target }, trash)) return target
  if (direction.x > 0) return { ...target, x: trash.x - note.width }
  if (direction.y > 0) return { ...target, y: trash.y - note.height }
  return position
}

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
   * If focus was inside the deleted note, moves it to a neighbouring note or the "New Note"
   * button so keyboard users are never dropped onto `document.body`.
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
      const boardSize = getElementSize(board)
      // Commands start from where the note is shown, which differs from the stored position
      // when the note was placed in a larger window.
      const position = placeInBoard(note, boardSize)

      if (event.shiftKey) {
        const size = constrainSize(
          position,
          { width: note.width + direction.x * KEYBOARD_STEP, height: note.height + direction.y * KEYBOARD_STEP },
          boardSize,
        )
        if (position.x !== note.x || position.y !== note.y) updateNotePosition(noteId, position)
        updateNoteSize(noteId, size)
        announce(`Resized to ${Math.round(size.width)} by ${Math.round(size.height)} pixels`)
      } else {
        const next = getKeyboardTarget(note, position, direction, boardSize)
        updateNotePosition(noteId, next)
        announce(`Moved to X ${Math.round(next.x)}, Y ${Math.round(next.y)}`)
      }
    },
    [announce, boardRef, bringToFront, deleteNoteAndMoveFocus, updateNotePosition, updateNoteSize],
  )

  return { handleNoteKeyDown, deleteNoteAndMoveFocus }
}
