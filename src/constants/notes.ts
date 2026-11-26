import type { Dimensions, NoteColor } from '../types/note'

export const MIN_WIDTH = 150
export const MIN_HEIGHT = 150

export const DEFAULT_DIMENSIONS: Dimensions = {
  width: 220,
  height: 220,
}

export const DEFAULT_COLOR: NoteColor = 'yellow'

export const NOTE_COLORS: Record<NoteColor, string> = {
  yellow: '#fff3a8',
  blue: '#c6e4ff',
  green: '#cdf2c6',
  pink: '#ffd3e2',
  purple: '#e2d6ff',
}
