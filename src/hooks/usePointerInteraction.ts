import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent, RefObject } from 'react'
import { DEFAULT_DIMENSIONS, MIN_DRAWN_SIZE } from '../constants/notes'
import type { Announce } from '../types/announcement'
import type { PointerInteraction } from '../types/interaction'
import type { Dimensions, Note, Position } from '../types/note'
import { clamp, getRectFromPoints, isPointInRect } from '../utils/geometry'

/**
 * Dependencies of `usePointerInteraction`: the current notes, refs to the board and
 * trash elements, the store actions each gesture commits to and the announcer.
 */
interface PointerInteractionOptions {
  notes: Note[]
  boardRef: RefObject<HTMLElement | null>
  trashRef: RefObject<HTMLDivElement | null>
  addNote: (bounds: Position & Dimensions) => string
  bringToFront: (id: string) => void
  updateNotePosition: (id: string, position: Position) => void
  updateNoteSize: (id: string, dimensions: Dimensions) => void
  deleteNote: (id: string) => void
  announce: Announce
}

const IDLE: PointerInteraction = { kind: 'idle' }

/**
 * Drives every pointer gesture on the board (draw-to-create, drag, resize, drop on
 * trash and double-click) as a single state machine. The board captures the pointer,
 * so notes only need to report where a gesture starts.
 *
 * @param {PointerInteractionOptions} options - Notes, element refs, store actions and announcer.
 * @returns {object} The current `interaction`, the stable `startDrag` / `startResize`
 * callbacks for notes, and `boardHandlers` to spread on the board element.
 */
export function usePointerInteraction({
  notes,
  boardRef,
  trashRef,
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

  /**
   * Converts viewport coordinates into board coordinates.
   *
   * @param {{ clientX: number, clientY: number }} event - Pointer or mouse event.
   * @returns {Position} The point relative to the board's top-left corner.
   */
  const toBoardPoint = useCallback(
    (event: { clientX: number; clientY: number }): Position => {
      const rect = boardRef.current?.getBoundingClientRect()
      return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) }
    },
    [boardRef],
  )

  /**
   * Captures the pointer on the board so pointermove/pointerup keep flowing to it even
   * when the cursor outruns the note or leaves the window.
   *
   * @param {PointerEvent} event - Event of the pointer to capture.
   * @returns {void}
   */
  const capturePointer = useCallback(
    (event: PointerEvent) => boardRef.current?.setPointerCapture(event.pointerId),
    [boardRef],
  )

  /**
   * Starts moving a note: raises it and remembers where it was grabbed.
   *
   * @param {PointerEvent<HTMLElement>} event - `pointerdown` on the note.
   * @param {string} noteId - Id of the note to move.
   * @returns {void}
   */
  const startDrag = useCallback(
    (event: PointerEvent<HTMLElement>, noteId: string) => {
      const note = notesRef.current.find((candidate) => candidate.id === noteId)
      if (event.button !== 0 || !note) return
      event.stopPropagation()
      bringToFront(noteId)
      capturePointer(event)
      const pointer = toBoardPoint(event)
      setInteraction({
        kind: 'dragging',
        pointerId: event.pointerId,
        noteId,
        offset: { x: pointer.x - note.x, y: pointer.y - note.y },
        isOverTrash: false,
      })
    },
    [bringToFront, capturePointer, toBoardPoint],
  )

  /**
   * Starts resizing a note from its bottom-right handle.
   *
   * @param {PointerEvent<HTMLElement>} event - `pointerdown` on the resize handle.
   * @param {string} noteId - Id of the note to resize.
   * @returns {void}
   */
  const startResize = useCallback(
    (event: PointerEvent<HTMLElement>, noteId: string) => {
      const note = notesRef.current.find((candidate) => candidate.id === noteId)
      if (event.button !== 0 || !note) return
      event.stopPropagation()
      bringToFront(noteId)
      capturePointer(event)
      setInteraction({
        kind: 'resizing',
        pointerId: event.pointerId,
        noteId,
        startPointer: toBoardPoint(event),
        startSize: { width: note.width, height: note.height },
      })
    },
    [bringToFront, capturePointer, toBoardPoint],
  )

  /**
   * Resets the background-press flag. Runs in the capture phase, before inner controls
   * stop propagation, so every press resets it.
   *
   * @returns {void}
   */
  const handleBoardPointerDownCapture = () => {
    pressedOnBackgroundRef.current = false
  }

  /**
   * Starts drawing a new note when the press lands on the empty board.
   *
   * @param {PointerEvent<HTMLElement>} event - `pointerdown` on the board.
   * @returns {void}
   */
  const handleBoardPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return
    pressedOnBackgroundRef.current = true
    capturePointer(event)
    const origin = toBoardPoint(event)
    setInteraction({ kind: 'creating', pointerId: event.pointerId, origin, current: origin })
  }

  /**
   * Advances the active gesture: updates the preview, moves the note (checking the
   * trash and announcing when it enters it) or resizes it, always within the board.
   *
   * @param {PointerEvent<HTMLElement>} event - Captured `pointermove`.
   * @returns {void}
   */
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (interaction.kind === 'idle' || interaction.pointerId !== event.pointerId) return
    const board = event.currentTarget
    const pointer = toBoardPoint(event)

    switch (interaction.kind) {
      case 'creating': {
        const current = {
          x: clamp(pointer.x, 0, board.clientWidth),
          y: clamp(pointer.y, 0, board.clientHeight),
        }
        setInteraction({ ...interaction, current })
        break
      }
      case 'dragging': {
        const note = notesRef.current.find((candidate) => candidate.id === interaction.noteId)
        if (!note) return
        updateNotePosition(note.id, {
          x: clamp(pointer.x - interaction.offset.x, 0, board.clientWidth - note.width),
          y: clamp(pointer.y - interaction.offset.y, 0, board.clientHeight - note.height),
        })
        const trashRect = trashRef.current?.getBoundingClientRect()
        const isOverTrash = trashRect !== undefined && isPointInRect({ x: event.clientX, y: event.clientY }, trashRect)
        if (isOverTrash !== interaction.isOverTrash) {
          setInteraction({ ...interaction, isOverTrash })
          if (isOverTrash) announce('Note over trash zone. Release to delete it.', 'assertive')
        }
        break
      }
      case 'resizing': {
        const note = notesRef.current.find((candidate) => candidate.id === interaction.noteId)
        if (!note) return
        updateNoteSize(note.id, {
          width: Math.min(interaction.startSize.width + pointer.x - interaction.startPointer.x, board.clientWidth - note.x),
          height: Math.min(interaction.startSize.height + pointer.y - interaction.startPointer.y, board.clientHeight - note.y),
        })
        break
      }
    }
  }

  /**
   * Commits the active gesture: creates the drawn note if it is big enough, or deletes
   * (and announces) the dragged note if it was dropped on the trash.
   *
   * @param {PointerEvent<HTMLElement>} event - Captured `pointerup`.
   * @returns {void}
   */
  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (interaction.kind === 'idle' || interaction.pointerId !== event.pointerId) return

    if (interaction.kind === 'creating') {
      const rect = getRectFromPoints(interaction.origin, interaction.current)
      if (rect.width >= MIN_DRAWN_SIZE && rect.height >= MIN_DRAWN_SIZE) {
        addNote(rect)
      }
    } else if (interaction.kind === 'dragging' && interaction.isOverTrash) {
      deleteNote(interaction.noteId)
      announce('Sticky note deleted')
    }
    setInteraction(IDLE)
  }

  /**
   * Aborts the active gesture without committing it.
   *
   * @param {PointerEvent<HTMLElement>} event - Captured `pointercancel`.
   * @returns {void}
   */
  const handlePointerCancel = (event: PointerEvent<HTMLElement>) => {
    if (interaction.kind !== 'idle' && interaction.pointerId === event.pointerId) {
      setInteraction(IDLE)
    }
  }

  /**
   * Creates a default-size note centered on the cursor, only when the presses started
   * on the empty board.
   *
   * @param {MouseEvent<HTMLElement>} event - `dblclick` on the board.
   * @returns {void}
   */
  const handleDoubleClick = (event: MouseEvent<HTMLElement>) => {
    if (!pressedOnBackgroundRef.current) return
    const pointer = toBoardPoint(event)
    addNote({
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
