import type { Dimensions, Position } from './note'

/**
 * Current pointer gesture on the board, modeled as a discriminated union on `kind`
 * so each state only carries the data it needs.
 *
 * - `idle`: no gesture in progress.
 * - `creating`: drawing a new note from `origin` to `current`.
 * - `dragging`: moving a note; `offset` is the pointer position inside the note.
 * - `resizing`: resizing a note from its bottom-right handle.
 */
export type PointerInteraction =
  | { kind: 'idle' }
  | { kind: 'creating'; pointerId: number; origin: Position; current: Position }
  | { kind: 'dragging'; pointerId: number; noteId: string; offset: Position; isOverTrash: boolean }
  | { kind: 'resizing'; pointerId: number; noteId: string; startPointer: Position; startSize: Dimensions }
