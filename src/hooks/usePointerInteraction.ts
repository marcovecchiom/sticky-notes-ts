import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent, RefObject } from 'react'
import { DEFAULT_DIMENSIONS, MIN_DRAWN_SIZE, MIN_HEIGHT, MIN_WIDTH } from '../constants/notes'
import type { Announce } from '../types/announcement'
import type { PointerInteraction } from '../types/interaction'
import type { Dimensions, Note, Position, Rect } from '../types/note'
import {
  clamp,
  clampToBoard,
  constrainSize,
  getElementSize,
  getRectFromPoints,
  getTrashRect,
  placeInBoard,
  rectsIntersect,
} from '../utils/geometry'

interface PointerInteractionOptions {
  notes: Note[]
  boardRef: RefObject<HTMLElement | null>
  addNote: (bounds: Rect) => string
  bringToFront: (id: string) => void
  updateNotePosition: (id: string, position: Position) => void
  updateNoteSize: (id: string, dimensions: Dimensions) => void
  deleteNote: (id: string) => void
  announce: Announce
}

const IDLE: PointerInteraction = { kind: 'idle' }

/**
 * Pointer gesture state machine for the board. Notes only report where a gesture starts;
 * the board captures the pointer and handles every move and release itself.
 */
export function usePointerInteraction({
  notes,
  boardRef,
  addNote,
  bringToFront,
  updateNotePosition,
  updateNoteSize,
  deleteNote,
  announce,
}: PointerInteractionOptions) {
  const [interaction, setInteraction] = useState<PointerInteraction>(IDLE)
  // Lets the gesture-start callbacks stay stable (and notes memoized) while reading fresh notes.
  const notesRef = useRef(notes)
  useEffect(() => {
    notesRef.current = notes
  }, [notes])
  // Pointer capture retargets click/dblclick to the board, so the event target can't tell
  // whether a double-click happened on a note; the gesture origin is tracked instead.
  const pressedOnBackgroundRef = useRef(false)

  const toBoardPoint = useCallback(
    (event: { clientX: number; clientY: number }): Position => {
      const rect = boardRef.current?.getBoundingClientRect()
      return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) }
    },
    [boardRef],
  )

  /**
   * Capturing on the board keeps pointermove/pointerup flowing to it even when the cursor
   * outruns the note or leaves the window.
   */
  const capturePointer = useCallback(
    (event: PointerEvent) => boardRef.current?.setPointerCapture(event.pointerId),
    [boardRef],
  )

  /**
   * The board renders resting notes at their placed position, which can differ from the stored
   * one (e.g. after the window shrank); gestures start from what the user sees, so it is saved first.
   */
  const commitVisiblePosition = useCallback(
    (note: Note): Position => {
      const position = boardRef.current ? placeInBoard(note, getElementSize(boardRef.current)) : note
      if (position.x !== note.x || position.y !== note.y) updateNotePosition(note.id, position)
      return position
    },
    [boardRef, updateNotePosition],
  )

  const createNoteAt = useCallback(
    (rect: Rect) => {
      const board = boardRef.current
      const size = { width: Math.max(MIN_WIDTH, rect.width), height: Math.max(MIN_HEIGHT, rect.height) }
      const position = board ? placeInBoard({ ...rect, ...size }, getElementSize(board)) : rect
      addNote({ ...position, ...size })
    },
    [addNote, boardRef],
  )

  /** Stores where the note was grabbed so it does not jump to the cursor. */
  const startDrag = useCallback(
    (event: PointerEvent<HTMLElement>, noteId: string) => {
      const note = notesRef.current.find((candidate) => candidate.id === noteId)
      if (event.button !== 0 || !note) return
      event.stopPropagation()
      bringToFront(noteId)
      capturePointer(event)
      const pointer = toBoardPoint(event)
      const position = commitVisiblePosition(note)
      setInteraction({
        kind: 'dragging',
        pointerId: event.pointerId,
        noteId,
        offset: { x: pointer.x - position.x, y: pointer.y - position.y },
        isOverTrash: false,
      })
    },
    [bringToFront, capturePointer, commitVisiblePosition, toBoardPoint],
  )

  const startResize = useCallback(
    (event: PointerEvent<HTMLElement>, noteId: string) => {
      const note = notesRef.current.find((candidate) => candidate.id === noteId)
      if (event.button !== 0 || !note) return
      event.stopPropagation()
      bringToFront(noteId)
      commitVisiblePosition(note)
      capturePointer(event)
      setInteraction({
        kind: 'resizing',
        pointerId: event.pointerId,
        noteId,
        startPointer: toBoardPoint(event),
        startSize: { width: note.width, height: note.height },
      })
    },
    [bringToFront, capturePointer, commitVisiblePosition, toBoardPoint],
  )

  /** Runs in the capture phase, before inner controls stop propagation, so every press resets it. */
  const handleBoardPointerDownCapture = () => {
    pressedOnBackgroundRef.current = false
  }

  const handleBoardPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return
    pressedOnBackgroundRef.current = true
    capturePointer(event)
    const origin = toBoardPoint(event)
    setInteraction({ kind: 'creating', pointerId: event.pointerId, origin, current: origin })
  }

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (interaction.kind === 'idle' || interaction.pointerId !== event.pointerId) return
    const board = getElementSize(event.currentTarget)
    const pointer = toBoardPoint(event)

    switch (interaction.kind) {
      case 'creating': {
        const current = {
          x: clamp(pointer.x, 0, board.width),
          y: clamp(pointer.y, 0, board.height),
        }
        setInteraction({ ...interaction, current })
        break
      }
      case 'dragging': {
        const note = notesRef.current.find((candidate) => candidate.id === interaction.noteId)
        if (!note) return
        const position = clampToBoard(
          { ...note, x: pointer.x - interaction.offset.x, y: pointer.y - interaction.offset.y },
          board,
        )
        updateNotePosition(note.id, position)
        // While dragging, the note may overlap the trash; any overlap marks it for deletion.
        const isOverTrash = rectsIntersect({ ...note, ...position }, getTrashRect(board))
        if (isOverTrash !== interaction.isOverTrash) {
          setInteraction({ ...interaction, isOverTrash })
          if (isOverTrash) announce('Note over trash zone. Release to delete it.', 'assertive')
        }
        break
      }
      case 'resizing': {
        const note = notesRef.current.find((candidate) => candidate.id === interaction.noteId)
        if (!note) return
        const requested = {
          width: interaction.startSize.width + pointer.x - interaction.startPointer.x,
          height: interaction.startSize.height + pointer.y - interaction.startPointer.y,
        }
        updateNoteSize(note.id, constrainSize(note, requested, board))
        break
      }
    }
  }

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (interaction.kind === 'idle' || interaction.pointerId !== event.pointerId) return

    if (interaction.kind === 'creating') {
      const rect = getRectFromPoints(interaction.origin, interaction.current)
      if (rect.width >= MIN_DRAWN_SIZE && rect.height >= MIN_DRAWN_SIZE) {
        createNoteAt(rect)
      }
    } else if (interaction.kind === 'dragging' && interaction.isOverTrash) {
      deleteNote(interaction.noteId)
      announce('Sticky note deleted')
    }
    setInteraction(IDLE)
  }

  const handlePointerCancel = (event: PointerEvent<HTMLElement>) => {
    if (interaction.kind !== 'idle' && interaction.pointerId === event.pointerId) {
      setInteraction(IDLE)
    }
  }

  const handleDoubleClick = (event: MouseEvent<HTMLElement>) => {
    if (!pressedOnBackgroundRef.current) return
    const pointer = toBoardPoint(event)
    createNoteAt({
      x: pointer.x - DEFAULT_DIMENSIONS.width / 2,
      y: pointer.y - DEFAULT_DIMENSIONS.height / 2,
      ...DEFAULT_DIMENSIONS,
    })
  }

  return {
    interaction,
    startDrag,
    startResize,
    boardHandlers: {
      onPointerDownCapture: handleBoardPointerDownCapture,
      onPointerDown: handleBoardPointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onDoubleClick: handleDoubleClick,
    },
  }
}
