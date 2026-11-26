import { memo, useEffect, useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { NOTE_INSTRUCTIONS_ID } from '../constants/a11y'
import { NOTE_COLOR_OPTIONS, NOTE_COLORS } from '../constants/notes'
import type { Note, NoteColor } from '../types/note'
import { CloseIcon, GripIcon, ResizeHandleIcon } from './Icons'
import styles from './StickyNote.module.css'

const LABEL_EXCERPT_LENGTH = 30

interface StickyNoteProps {
  note: Note
  /** Displayed position, kept inside the board; may differ from the stored `note.x` / `note.y`. */
  x: number
  y: number
  isDragging: boolean
  isOverTrash: boolean
  autoFocusText: boolean
  onDragStart: (event: PointerEvent<HTMLElement>, noteId: string) => void
  onResizeStart: (event: PointerEvent<HTMLElement>, noteId: string) => void
  onFocus: (noteId: string) => void
  onKeyCommand: (event: KeyboardEvent<HTMLElement>, noteId: string) => void
  onDelete: (noteId: string) => void
  onChangeText: (noteId: string, text: string) => void
  onChangeColor: (noteId: string, color: NoteColor) => void
}

function getNoteLabel(text: string): string {
  const excerpt = text.trim().slice(0, LABEL_EXCERPT_LENGTH)
  return `Sticky note: ${excerpt || 'empty'}`
}

function StickyNoteComponent({
  note,
  x,
  y,
  isDragging,
  isOverTrash,
  autoFocusText,
  onDragStart,
  onResizeStart,
  onFocus,
  onKeyCommand,
  onDelete,
  onChangeText,
  onChangeColor,
}: StickyNoteProps) {
  const cardRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const className = [styles.note, isDragging && styles.dragging, isOverTrash && styles.overTrash]
    .filter(Boolean)
    .join(' ')

  useEffect(() => {
    if (autoFocusText) textRef.current?.focus()
  }, [autoFocusText])

  /** Inner controls must not start a drag; the card still gets focus and is raised. */
  const handleControlPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation()
  }

  /**
   * Keys typed in the text or pressed on inner buttons keep their native behavior; only keys
   * pressed on the card itself are note commands.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target === textRef.current) {
      if (event.key === 'Escape') {
        event.preventDefault()
        cardRef.current?.focus()
      }
      return
    }
    if (event.target !== event.currentTarget) return

    if (event.key === 'Enter') {
      event.preventDefault()
      textRef.current?.focus()
      return
    }
    onKeyCommand(event, note.id)
  }

  return (
    <article
      ref={cardRef}
      className={className}
      style={{
        // A transform keeps moves on the compositor, avoiding the layout reflow of top/left.
        transform: `translate3d(${x}px, ${y}px, 0)`,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
        backgroundColor: NOTE_COLORS[note.color],
      }}
      tabIndex={0}
      data-note-id={note.id}
      aria-label={getNoteLabel(note.text)}
      aria-roledescription="sticky note"
      aria-describedby={NOTE_INSTRUCTIONS_ID}
      onPointerDown={(event) => onDragStart(event, note.id)}
      onFocus={() => onFocus(note.id)}
      onKeyDown={handleKeyDown}
    >
      <header className={styles.header}>
        <div className={styles.palette} role="group" aria-label="Note color">
          {NOTE_COLOR_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={styles.swatch}
              style={{ backgroundColor: NOTE_COLORS[option.id] }}
              aria-label={option.label}
              aria-pressed={option.id === note.color}
              onPointerDown={handleControlPointerDown}
              onClick={() => onChangeColor(note.id, option.id)}
            />
          ))}
        </div>
        <GripIcon className={styles.grip} />
        <button
          type="button"
          className={styles.deleteButton}
          aria-label="Delete note"
          onPointerDown={handleControlPointerDown}
          onClick={() => onDelete(note.id)}
        >
          <CloseIcon />
        </button>
      </header>
      <textarea
        ref={textRef}
        className={styles.text}
        value={note.text}
        placeholder="Write something…"
        aria-label="Note text"
        spellCheck={false}
        onPointerDown={handleControlPointerDown}
        onChange={(event) => onChangeText(note.id, event.target.value)}
      />
      <div
        className={styles.resizeHandle}
        aria-hidden="true"
        onPointerDown={(event) => onResizeStart(event, note.id)}
      >
        <ResizeHandleIcon />
      </div>
    </article>
  )
}

/** Memoized so dragging one note does not re-render the others. */
export const StickyNote = memo(StickyNoteComponent)
