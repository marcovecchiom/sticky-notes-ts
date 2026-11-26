import { memo } from 'react'
import type { PointerEvent } from 'react'
import { NOTE_COLORS } from '../constants/notes'
import type { Note } from '../types/note'
import { GripIcon, ResizeHandleIcon } from './Icons'
import styles from './StickyNote.module.css'

interface StickyNoteProps {
  note: Note
  isDragging: boolean
  isOverTrash: boolean
  onDragStart: (event: PointerEvent<HTMLElement>, noteId: string) => void
  onResizeStart: (event: PointerEvent<HTMLElement>, noteId: string) => void
}

function StickyNoteComponent({ note, isDragging, isOverTrash, onDragStart, onResizeStart }: StickyNoteProps) {
  const className = [styles.note, isDragging && styles.dragging, isOverTrash && styles.overTrash]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={className}
      style={{
        transform: `translate3d(${note.x}px, ${note.y}px, 0)`,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
        backgroundColor: NOTE_COLORS[note.color],
      }}
      onPointerDown={(event) => onDragStart(event, note.id)}
    >
      <header className={styles.header}>
        <GripIcon />
      </header>
      <div className={styles.body}>{note.text}</div>
      <div
        className={styles.resizeHandle}
        aria-label="Resize note"
        onPointerDown={(event) => onResizeStart(event, note.id)}
      >
        <ResizeHandleIcon />
      </div>
    </article>
  )
}

export const StickyNote = memo(StickyNoteComponent)
