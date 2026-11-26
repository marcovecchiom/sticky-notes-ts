import { useRef } from 'react'
import { usePointerInteraction } from '../hooks/usePointerInteraction'
import type { Dimensions, Note, NoteColor, Position } from '../types/note'
import { getRectFromPoints } from '../utils/geometry'
import styles from './Board.module.css'
import { StickyNote } from './StickyNote'
import { TrashZone } from './TrashZone'

/** Props of `Board`: the notes to render and the store actions gestures and notes call. */
interface BoardProps {
  notes: Note[]
  addNote: (bounds: Position & Dimensions) => string
  bringToFront: (id: string) => void
  updateNotePosition: (id: string, position: Position) => void
  updateNoteSize: (id: string, dimensions: Dimensions) => void
  deleteNote: (id: string) => void
  updateNoteText: (id: string, text: string) => void
  updateNoteColor: (id: string, color: NoteColor) => void
}

/**
 * Canvas that renders the notes, the creation preview and the trash zone, and
 * handles every pointer gesture through `usePointerInteraction`.
 *
 * @param {BoardProps} props - Notes and store actions.
 * @returns {JSX.Element} The board element.
 */
export function Board({
  notes,
  addNote,
  bringToFront,
  updateNotePosition,
  updateNoteSize,
  deleteNote,
  updateNoteText,
  updateNoteColor,
}: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const trashRef = useRef<HTMLDivElement>(null)
  const { interaction, startDrag, startResize, boardHandlers } = usePointerInteraction({
    notes,
    boardRef,
    trashRef,
    addNote,
    bringToFront,
    updateNotePosition,
    updateNoteSize,
    deleteNote,
  })

  const draggingNoteId = interaction.kind === 'dragging' ? interaction.noteId : null
  const isOverTrash = interaction.kind === 'dragging' && interaction.isOverTrash
  const preview = interaction.kind === 'creating' ? getRectFromPoints(interaction.origin, interaction.current) : null

  return (
    <div
      ref={boardRef}
      className={`${styles.board} ${interaction.kind !== 'idle' ? styles.interacting : ''}`}
      {...boardHandlers}
    >
      <div className={styles.notesLayer}>
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            isDragging={note.id === draggingNoteId}
            isOverTrash={note.id === draggingNoteId && isOverTrash}
            onDragStart={startDrag}
            onResizeStart={startResize}
            onFocus={bringToFront}
            onChangeText={updateNoteText}
            onChangeColor={updateNoteColor}
          />
        ))}
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
      <TrashZone ref={trashRef} isVisible={draggingNoteId !== null} isHovered={isOverTrash} />
    </div>
  )
}
