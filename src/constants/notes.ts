import type { Dimensions, NoteColor } from '../types/note'

export const MIN_WIDTH = 150
export const MIN_HEIGHT = 150

export const DEFAULT_DIMENSIONS: Dimensions = {
  width: 220,
  height: 220,
}

export const DEFAULT_COLOR: NoteColor = 'yellow'

// Values reference the design tokens declared in styles/theme.css.
export const NOTE_COLORS: Record<NoteColor, string> = {
  yellow: 'var(--note-yellow)',
  amber: 'var(--note-amber)',
  sky: 'var(--note-sky)',
  teal: 'var(--note-teal)',
}

export const NOTE_COLOR_OPTIONS: readonly { id: NoteColor; label: string }[] = [
  { id: 'yellow', label: 'Yellow' },
  { id: 'amber', label: 'Amber' },
  { id: 'sky', label: 'Sky' },
  { id: 'teal', label: 'Teal' },
]

// Smaller drawn areas are treated as accidental clicks rather than a new note.
export const MIN_DRAWN_SIZE = 40

export const KEYBOARD_STEP = 16
