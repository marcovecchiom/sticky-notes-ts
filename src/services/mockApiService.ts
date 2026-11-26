import type { Note } from '../types/note'

const NETWORK_LATENCY_MS = 300

// Stands in for the backend database; it lives only for the page session.
let remoteNotes: Note[] = []

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Simulates `GET /notes`. Returns a copy so callers cannot mutate the server state. */
export async function fetchNotes(): Promise<Note[]> {
  await delay(NETWORK_LATENCY_MS)
  return structuredClone(remoteNotes)
}

/** Simulates `PUT /notes`, replacing the server state with the client state. */
export async function syncNotes(notes: Note[]): Promise<void> {
  await delay(NETWORK_LATENCY_MS)
  remoteNotes = structuredClone(notes)
}
