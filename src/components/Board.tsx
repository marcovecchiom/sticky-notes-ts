import { useRef } from 'react'
import { BOARD_INSTRUCTIONS_ID, NOTE_INSTRUCTIONS_ID } from '../constants/a11y'
import { useNoteKeyboard } from '../hooks/useNoteKeyboard'
import { usePointerInteraction } from '../hooks/usePointerInteraction'
import type { Announce } from '../types/announcement'
import type { Dimensions, Note, NoteColor, Position } from '../types/note'
import { getRectFromPoints } from '../utils/geometry'
import styles from './Board.module.css'
import { StickyNote } from './StickyNote'
import { TrashZone } from './TrashZone'

/**
 * Props of `Board`: the notes to render, the note whose text should take focus, the
 * store actions gestures and notes call, and the screen reader announcer.
 */
interface BoardProps {
  notes: Note[]
  autoFocusNoteId: string | null
  addNote: (bounds: Position & Dimensions) => string
  bringToFront: (id: string) => void
  updateNotePosition: (id: string, position: Position) => void
  updateNoteSize: (id: string, dimensions: Dimensions) => void
  deleteNote: (id: string) => void
  updateNoteText: (id: string, text: string) => void
  updateNoteColor: (id: string, color: NoteColor) => void
  announce: Announce
}

/**
 * Main landmark that renders the notes, the creation preview and the trash zone, and
 * handles pointer gestures (`usePointerInteraction`) and keyboard commands
 * (`useNoteKeyboard`).
 *
 * @param {BoardProps} props - Notes, focus target, store actions and announcer.
 * @returns {JSX.Element} The board element.
 */
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
  const trashRef = useRef<HTMLDivElement>(null)
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
    trashRef,
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
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
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
    </main>
  )
}
