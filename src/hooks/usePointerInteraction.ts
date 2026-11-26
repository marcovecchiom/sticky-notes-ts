import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent, RefObject } from 'react'
import { DEFAULT_DIMENSIONS, MIN_DRAWN_SIZE } from '../constants/notes'
import type { PointerInteraction } from '../types/interaction'
import type { Dimensions, Note, Position } from '../types/note'
import { clamp, getRectFromPoints, isPointInRect } from '../utils/geometry'

interface PointerInteractionOptions {
  notes: Note[]
  boardRef: RefObject<HTMLDivElement | null>
  trashRef: RefObject<HTMLDivElement | null>
  addNote: (bounds: Position & Dimensions) => string
  bringToFront: (id: string) => void
  updateNotePosition: (id: string, position: Position) => void
  updateNoteSize: (id: string, dimensions: Dimensions) => void
  deleteNote: (id: string) => void
}

const IDLE: PointerInteraction = { kind: 'idle' }

export function usePointerInteraction({
  notes,
  boardRef,
  trashRef,
  addNote,
  bringToFront,
  updateNotePosition,
  updateNoteSize,
  deleteNote,
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

  // Capturing on the board keeps pointermove/pointerup flowing to it even when the
  // cursor outruns the note or leaves the window.
  const capturePointer = useCallback(
    (event: PointerEvent) => boardRef.current?.setPointerCapture(event.pointerId),
    [boardRef],
  )

  const startDrag = useCallback(
    (event: PointerEvent<HTMLElement>, noteId: string) => {
      const note = notesRef.current.find((candidate) => candidate.id === noteId)
      if (event.button !== 0 || !note) return
      event.stopPropagation()
      pressedOnBackgroundRef.current = false
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

  const startResize = useCallback(
    (event: PointerEvent<HTMLElement>, noteId: string) => {
      const note = notesRef.current.find((candidate) => candidate.id === noteId)
      if (event.button !== 0 || !note) return
      event.stopPropagation()
      pressedOnBackgroundRef.current = false
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

  const handleBoardPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return
    pressedOnBackgroundRef.current = true
    capturePointer(event)
    const origin = toBoardPoint(event)
    setInteraction({ kind: 'creating', pointerId: event.pointerId, origin, current: origin })
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
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

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (interaction.kind === 'idle' || interaction.pointerId !== event.pointerId) return

    if (interaction.kind === 'creating') {
      const rect = getRectFromPoints(interaction.origin, interaction.current)
      if (rect.width >= MIN_DRAWN_SIZE && rect.height >= MIN_DRAWN_SIZE) {
        addNote(rect)
      }
    } else if (interaction.kind === 'dragging' && interaction.isOverTrash) {
      deleteNote(interaction.noteId)
    }
    setInteraction(IDLE)
  }

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (interaction.kind !== 'idle' && interaction.pointerId === event.pointerId) {
      setInteraction(IDLE)
    }
  }

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
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
      onPointerDown: handleBoardPointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onDoubleClick: handleDoubleClick,
    },
  }
}
