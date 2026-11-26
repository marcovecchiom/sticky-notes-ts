import { NOTE_COLORS } from '../constants/notes'
import type { Note, NoteColor } from '../types/note'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isNoteColor(value: unknown): value is NoteColor {
  return typeof value === 'string' && Object.hasOwn(NOTE_COLORS, value)
}

export function isNote(value: unknown): value is Note {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    isNoteColor(value.color) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.width) &&
    value.width > 0 &&
    isFiniteNumber(value.height) &&
    value.height > 0 &&
    isFiniteNumber(value.zIndex)
  )
}

// Keeps the valid entries instead of discarding the whole board for one corrupted note.
export function parseNotes(value: unknown): Note[] {
  return Array.isArray(value) ? value.filter(isNote) : []
}
