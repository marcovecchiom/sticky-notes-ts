import { useCallback, useEffect, useState } from 'react'
import styles from './App.module.css'
import { Board } from './components/Board'
import { LiveAnnouncer } from './components/LiveAnnouncer'
import { Toolbar } from './components/Toolbar'
import { DEFAULT_DIMENSIONS } from './constants/notes'
import { useAnnouncer } from './hooks/useAnnouncer'
import { useNotesManager } from './hooks/useNotesManager'
import type { Rect } from './types/note'

const NEW_NOTE_ORIGIN = 32
const NEW_NOTE_CASCADE_STEP = 24
const NEW_NOTE_CASCADE_LENGTH = 10

function App() {
  const {
    notes,
    syncStatus,
    addNote,
    bringToFront,
    updateNotePosition,
    updateNoteSize,
    updateNoteText,
    updateNoteColor,
    deleteNote,
  } = useNotesManager()
  const { announcement, announce } = useAnnouncer()
  const [autoFocusNoteId, setAutoFocusNoteId] = useState<string | null>(null)

  useEffect(() => {
    if (syncStatus === 'error') announce('Could not save changes', 'assertive')
  }, [announce, syncStatus])

  const createNote = useCallback(
    (bounds: Rect): string => {
      const id = addNote(bounds)
      setAutoFocusNoteId(id)
      announce('Sticky note created')
      return id
    },
    [addNote, announce],
  )

  const handleAddNote = useCallback(() => {
    // Cascades toolbar-created notes so consecutive ones do not fully overlap.
    const offset = NEW_NOTE_ORIGIN + (notes.length % NEW_NOTE_CASCADE_LENGTH) * NEW_NOTE_CASCADE_STEP
    createNote({ x: offset, y: offset, ...DEFAULT_DIMENSIONS })
  }, [createNote, notes.length])

  return (
    <div className={styles.app}>
      <Toolbar syncStatus={syncStatus} onAddNote={handleAddNote} />
      <Board
        notes={notes}
        autoFocusNoteId={autoFocusNoteId}
        addNote={createNote}
        bringToFront={bringToFront}
        updateNotePosition={updateNotePosition}
        updateNoteSize={updateNoteSize}
        deleteNote={deleteNote}
        updateNoteText={updateNoteText}
        updateNoteColor={updateNoteColor}
        announce={announce}
      />
      <LiveAnnouncer announcement={announcement} />
    </div>
  )
}

export default App
