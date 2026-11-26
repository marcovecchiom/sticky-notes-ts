/** Background colors a note can take; each maps to a `--note-*` design token. */
export type NoteColor = 'yellow' | 'amber' | 'sky' | 'teal'

/** Top-left coordinates, in pixels, relative to the board. */
export interface Position {
  x: number
  y: number
}

/** Width and height of a rectangle, in pixels. */
export interface Dimensions {
  width: number
  height: number
}

/**
 * A sticky note placed on the board.
 *
 * @property {string} id - Unique identifier (UUID).
 * @property {string} text - Editable content.
 * @property {NoteColor} color - Background color key.
 * @property {number} zIndex - Stacking order; higher values render on top.
 */
export interface Note extends Position, Dimensions {
  id: string
  text: string
  color: NoteColor
  zIndex: number
}
