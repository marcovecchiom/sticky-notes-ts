import { NOTES_STORAGE_KEY } from '../constants/storage'
import type { Note } from '../types/note'
import { parseNotes } from './noteValidation'

/**
 * Restores the saved notes from `localStorage`.
 *
 * @returns {Note[]} The valid saved notes; an empty array if nothing was saved or the data is unreadable.
 */
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
 * Persists the notes to `localStorage`.
 *
 * @param {Note[]} notes - Notes to save.
 * @returns {boolean} `true` on success; `false` if storage is full or unavailable.
 */
export function saveNotesToStorage(notes: Note[]): boolean {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
    return true
  } catch (error) {
    // QuotaExceededError or storage disabled (e.g. private mode).
    console.warn('Could not save notes to localStorage', error)
    return false
  }
}
