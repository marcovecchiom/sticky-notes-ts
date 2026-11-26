import type { Note } from '../types/note'

const NETWORK_LATENCY_MS = 300

// Stands in for the backend database; it lives only for the page session.
let remoteNotes: Note[] = []

/**
 * Waits for the given time to simulate network latency.
 *
 * @param {number} ms - Delay in milliseconds.
 * @returns {Promise<void>} Resolves after the delay.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Simulates `GET /notes` against the in-memory backend.
 *
 * @returns {Promise<Note[]>} A copy of the notes stored on the server.
 */
export async function fetchNotes(): Promise<Note[]> {
  await delay(NETWORK_LATENCY_MS)
  return structuredClone(remoteNotes)
}

/**
 * Simulates `PUT /notes`, replacing the server copy with the client state.
 *
 * @param {Note[]} notes - Full list of notes to store.
 * @returns {Promise<void>} Resolves once the server has stored them.
 */
export async function syncNotes(notes: Note[]): Promise<void> {
  await delay(NETWORK_LATENCY_MS)
  remoteNotes = structuredClone(notes)
}
