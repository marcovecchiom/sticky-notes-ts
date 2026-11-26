import type { Note } from '../types/note'

const NETWORK_LATENCY_MS = 300

// Stands in for the backend database; it lives only for the page session.
let remoteNotes: Note[] = []

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchNotes(): Promise<Note[]> {
  await delay(NETWORK_LATENCY_MS)
  return structuredClone(remoteNotes)
}

export async function syncNotes(notes: Note[]): Promise<void> {
  await delay(NETWORK_LATENCY_MS)
  remoteNotes = structuredClone(notes)
}
