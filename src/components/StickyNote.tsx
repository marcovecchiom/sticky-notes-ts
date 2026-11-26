import { memo, useEffect, useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { NOTE_INSTRUCTIONS_ID } from '../constants/a11y'
import { NOTE_COLOR_OPTIONS, NOTE_COLORS } from '../constants/notes'
import type { Note, NoteColor } from '../types/note'
import { CloseIcon, GripIcon, ResizeHandleIcon } from './Icons'
import styles from './StickyNote.module.css'

const LABEL_EXCERPT_LENGTH = 30

/**
 * Props of `StickyNote`. Callbacks receive the note id so the board can pass the same
 * stable functions to every note.
 *
 * @property {Note} note - Note to render.
 * @property {boolean} isDragging - Whether the note is being moved.
 * @property {boolean} isOverTrash - Whether the note is being dragged over the trash.
 * @property {boolean} autoFocusText - Whether to focus the text when the flag turns on (new notes).
 * @property {Function} onDragStart - Starts moving the note.
 * @property {Function} onResizeStart - Starts resizing the note.
 * @property {Function} onFocus - Brings the note to the front.
 * @property {Function} onKeyCommand - Runs a keyboard move, resize or delete command.
 * @property {Function} onDelete - Deletes the note.
 * @property {Function} onChangeText - Updates the note text.
 * @property {Function} onChangeColor - Updates the note color.
 */
interface StickyNoteProps {
  note: Note
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

/**
 * Builds the accessible name of a note from the start of its text.
 *
 * @param {string} text - Note content.
 * @returns {string} A label such as `"Sticky note: Buy milk"`.
 */
function getNoteLabel(text: string): string {
  const excerpt = text.trim().slice(0, LABEL_EXCERPT_LENGTH)
  return `Sticky note: ${excerpt || 'empty'}`
}

/**
 * A draggable, resizable sticky note with editable text, a color palette and a
 * delete button. The card itself is focusable and operable with the keyboard.
 *
 * @param {StickyNoteProps} props - Note data, visual state and callbacks.
 * @returns {JSX.Element} The note element.
 */
function StickyNoteComponent({
  note,
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

  /**
   * Keeps inner controls (text, buttons) from starting a drag.
   *
   * @param {PointerEvent<HTMLElement>} event - `pointerdown` on an inner control.
   * @returns {void}
   */
  const handleControlPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation()
  }

  /**
   * Keyboard map of the note: Escape leaves the text, Enter enters it, and the rest
   * of the keys on the card are forwarded as move, resize or delete commands.
   * Keys typed in the text or pressed on inner buttons keep their native behavior.
   *
   * @param {KeyboardEvent<HTMLElement>} event - `keydown` inside the note.
   * @returns {void}
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
        transform: `translate3d(${note.x}px, ${note.y}px, 0)`,
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

/** Memoized `StickyNoteComponent`: while one note moves, the others do not re-render. */
export const StickyNote = memo(StickyNoteComponent)
