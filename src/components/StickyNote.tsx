import { memo } from 'react'
import type { PointerEvent } from 'react'
import { NOTE_COLOR_OPTIONS, NOTE_COLORS } from '../constants/notes'
import type { Note, NoteColor } from '../types/note'
import { GripIcon, ResizeHandleIcon } from './Icons'
import styles from './StickyNote.module.css'

/**
 * Props of `StickyNote`. Callbacks receive the note id so the board can pass the same
 * stable functions to every note.
 *
 * @property {Note} note - Note to render.
 * @property {boolean} isDragging - Whether the note is being moved.
 * @property {boolean} isOverTrash - Whether the note is being dragged over the trash.
 * @property {Function} onDragStart - Starts moving the note.
 * @property {Function} onResizeStart - Starts resizing the note.
 * @property {Function} onFocus - Brings the note to the front.
 * @property {Function} onChangeText - Updates the note text.
 * @property {Function} onChangeColor - Updates the note color.
 */
interface StickyNoteProps {
  note: Note
  isDragging: boolean
  isOverTrash: boolean
  onDragStart: (event: PointerEvent<HTMLElement>, noteId: string) => void
  onResizeStart: (event: PointerEvent<HTMLElement>, noteId: string) => void
  onFocus: (noteId: string) => void
  onChangeText: (noteId: string, text: string) => void
  onChangeColor: (noteId: string, color: NoteColor) => void
}

/**
 * A draggable, resizable sticky note with editable text and a color palette.
 *
 * @param {StickyNoteProps} props - Note data, visual state and callbacks.
 * @returns {JSX.Element} The note element.
 */
function StickyNoteComponent({
  note,
  isDragging,
  isOverTrash,
  onDragStart,
  onResizeStart,
  onFocus,
  onChangeText,
  onChangeColor,
}: StickyNoteProps) {
  const className = [styles.note, isDragging && styles.dragging, isOverTrash && styles.overTrash]
    .filter(Boolean)
    .join(' ')

  /**
   * Keeps inner controls (text, color buttons) from starting a drag, while still
   * raising the note.
   *
   * @param {PointerEvent<HTMLElement>} event - `pointerdown` on an inner control.
   * @returns {void}
   */
  const handleControlPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation()
    onFocus(note.id)
  }

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
        <div className={styles.palette}>
          {NOTE_COLOR_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={styles.swatch}
              style={{ backgroundColor: NOTE_COLORS[option.id] }}
              aria-label={`Change color to ${option.label}`}
              aria-pressed={option.id === note.color}
              onPointerDown={handleControlPointerDown}
              onClick={() => onChangeColor(note.id, option.id)}
            />
          ))}
        </div>
        <GripIcon className={styles.grip} />
      </header>
      <textarea
        className={styles.text}
        value={note.text}
        placeholder="Write something…"
        aria-label="Note text"
        spellCheck={false}
        onPointerDown={handleControlPointerDown}
        onFocus={() => onFocus(note.id)}
        onChange={(event) => onChangeText(note.id, event.target.value)}
      />
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

/** Memoized `StickyNoteComponent`: while one note moves, the others do not re-render. */
export const StickyNote = memo(StickyNoteComponent)
