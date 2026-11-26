export type NoteColor = 'yellow' | 'amber' | 'sky' | 'teal'

export interface Position {
  x: number
  y: number
}

export interface Dimensions {
  width: number
  height: number
}

export interface Note extends Position, Dimensions {
  id: string
  text: string
  color: NoteColor
  zIndex: number
}
