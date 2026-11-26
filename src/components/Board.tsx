import { useRef } from 'react'
import { BOARD_INSTRUCTIONS_ID, NOTE_INSTRUCTIONS_ID } from '../constants/a11y'
import { useElementSize } from '../hooks/useElementSize'
import { useNoteKeyboard } from '../hooks/useNoteKeyboard'
import { usePointerInteraction } from '../hooks/usePointerInteraction'
import type { Announce } from '../types/announcement'
import type { Dimensions, Note, NoteColor, Position, Rect } from '../types/note'
import { clampToBoard, getRectFromPoints, placeInBoard } from '../utils/geometry'
import styles from './Board.module.css'
import { StickyNote } from './StickyNote'
import { TrashZone } from './TrashZone'

interface BoardProps {
  notes: Note[]
  autoFocusNoteId: string | null
  addNote: (bounds: Rect) => string
  bringToFront: (id: string) => void
  updateNotePosition: (id: string, position: Position) => void
  updateNoteSize: (id: string, dimensions: Dimensions) => void
  deleteNote: (id: string) => void
  updateNoteText: (id: string, text: string) => void
  updateNoteColor: (id: string, color: NoteColor) => void
  announce: Announce
}

export function Board({
  notes,
  autoFocusNoteId,
  addNote,
  bringToFront,
  updateNotePosition,
  updateNoteSize,
  deleteNote,
  updateNoteText,
  updateNoteColor,
  announce,
}: BoardProps) {
  const boardRef = useRef<HTMLElement>(null)
  const boardSize = useElementSize(boardRef)
  const { handleNoteKeyDown, deleteNoteAndMoveFocus } = useNoteKeyboard({
    notes,
    boardRef,
    bringToFront,
    updateNotePosition,
    updateNoteSize,
    deleteNote,
    announce,
  })
  const { interaction, startDrag, startResize, boardHandlers } = usePointerInteraction({
    notes,
    boardRef,
    addNote,
    bringToFront,
    updateNotePosition,
    updateNoteSize,
    deleteNote,
    announce,
  })

  const draggingNoteId = interaction.kind === 'dragging' ? interaction.noteId : null
  const isOverTrash = interaction.kind === 'dragging' && interaction.isOverTrash
  const preview = interaction.kind === 'creating' ? getRectFromPoints(interaction.origin, interaction.current) : null

  return (
    <main
      ref={boardRef}
      className={`${styles.board} ${interaction.kind !== 'idle' ? styles.interacting : ''}`}
      aria-label="Sticky notes workspace"
      aria-describedby={BOARD_INSTRUCTIONS_ID}
      {...boardHandlers}
    >
      <p id={BOARD_INSTRUCTIONS_ID} className="sr-only">
        Drag on empty space to draw a sticky note, double-click for a default-size note, or use the New Note
        button. Press Tab to reach a note and operate it with the keyboard.
      </p>
      <p id={NOTE_INSTRUCTIONS_ID} className="sr-only">
        Arrow keys move the note, Shift plus arrow keys resize it, Enter edits its text, Escape stops editing,
        and Delete removes it.
      </p>
      <div className={styles.notesLayer}>
        {notes.map((note) => {
          // The dragged note may cover the trash (that is how it gets deleted); resting notes may not.
          const position = !boardSize
            ? note
            : note.id === draggingNoteId
              ? clampToBoard(note, boardSize)
              : placeInBoard(note, boardSize)
          return (
            <StickyNote
              key={note.id}
              note={note}
              x={position.x}
              y={position.y}
              isDragging={note.id === draggingNoteId}
              isOverTrash={note.id === draggingNoteId && isOverTrash}
              autoFocusText={note.id === autoFocusNoteId}
              onDragStart={startDrag}
              onResizeStart={startResize}
              onFocus={bringToFront}
              onKeyCommand={handleNoteKeyDown}
              onDelete={deleteNoteAndMoveFocus}
              onChangeText={updateNoteText}
              onChangeColor={updateNoteColor}
            />
          )
        })}
      </div>
      {preview && (
        <div
          className={styles.preview}
          style={{
            transform: `translate3d(${preview.x}px, ${preview.y}px, 0)`,
            width: preview.width,
            height: preview.height,
          }}
        />
      )}
      <TrashZone isVisible={draggingNoteId !== null} isHovered={isOverTrash} />
    </main>
  )
}
