import { NOTES_STORAGE_KEY } from '../constants/storage'
import type { Note } from '../types/note'
import { parseNotes } from './noteValidation'

/** Never throws: missing, corrupted or unreadable data yields an empty board. */
export function loadNotesFromStorage(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY)
    return raw === null ? [] : parseNotes(JSON.parse(raw))
  } catch (error) {
    console.warn('Could not restore notes from localStorage', error)
    return []
  }
}

/**
 * Returns `false` instead of throwing (QuotaExceededError, storage disabled) so the UI
 * can report the failure.
 */
export function saveNotesToStorage(notes: Note[]): boolean {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
    return true
  } catch (error) {
    console.warn('Could not save notes to localStorage', error)
    return false
  }
}
