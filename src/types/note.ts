export type NoteColor = 'yellow' | 'amber' | 'sky' | 'teal'

/** Board-relative coordinates, in pixels. */
export interface Position {
  x: number
  y: number
}

export interface Dimensions {
  width: number
  height: number
}

export type Rect = Position & Dimensions

export interface Note extends Position, Dimensions {
  id: string
  text: string
  color: NoteColor
  zIndex: number
}
