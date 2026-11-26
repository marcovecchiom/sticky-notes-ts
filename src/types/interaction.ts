import type { Dimensions, Position } from './note'

export type PointerInteraction =
  | { kind: 'idle' }
  | { kind: 'creating'; pointerId: number; origin: Position; current: Position }
  | { kind: 'dragging'; pointerId: number; noteId: string; offset: Position; isOverTrash: boolean }
  | { kind: 'resizing'; pointerId: number; noteId: string; startPointer: Position; startSize: Dimensions }
