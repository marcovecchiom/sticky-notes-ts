import { NOTE_COLORS } from '../constants/notes'
import type { Note, NoteColor } from '../types/note'

/**
 * Type guard for non-null objects whose properties can be read safely.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} `true` if `value` is a non-null object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Type guard for numbers that are neither `NaN` nor infinite.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} `true` if `value` is a finite number.
 */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Type guard for the supported note colors.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} `true` if `value` is a key of `NOTE_COLORS`.
 */
export function isNoteColor(value: unknown): value is NoteColor {
  return typeof value === 'string' && Object.hasOwn(NOTE_COLORS, value)
}

/**
 * Type guard that validates the full shape of a note, including positive dimensions.
 *
 * @param {unknown} value - Value to check, typically parsed from JSON.
 * @returns {boolean} `true` if `value` is a valid `Note`.
 */
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

/**
 * Extracts the valid notes from untrusted data. Keeps the valid entries instead of
 * discarding the whole board for one corrupted note.
 *
 * @param {unknown} value - Parsed JSON that should be an array of notes.
 * @returns {Note[]} Valid notes, or an empty array if `value` is not an array.
 */
export function parseNotes(value: unknown): Note[] {
  return Array.isArray(value) ? value.filter(isNote) : []
}
