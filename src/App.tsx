import { useCallback } from 'react'
import styles from './App.module.css'
import { Board } from './components/Board'
import { Toolbar } from './components/Toolbar'
import { DEFAULT_DIMENSIONS } from './constants/notes'
import { useNotesManager } from './hooks/useNotesManager'

const NEW_NOTE_ORIGIN = 32
const NEW_NOTE_CASCADE_STEP = 24
const NEW_NOTE_CASCADE_LENGTH = 10

function App() {
  const { notes, syncStatus, addNote, bringToFront, updateNotePosition, updateNoteSize, deleteNote } =
    useNotesManager()

  // Cascades toolbar-created notes so consecutive ones don't fully overlap.
  const handleAddNote = useCallback(() => {
    const offset = NEW_NOTE_ORIGIN + (notes.length % NEW_NOTE_CASCADE_LENGTH) * NEW_NOTE_CASCADE_STEP
    addNote({ x: offset, y: offset, ...DEFAULT_DIMENSIONS })
  }, [addNote, notes.length])

  return (
    <div className={styles.app}>
      <Toolbar syncStatus={syncStatus} onAddNote={handleAddNote} />
      <Board
        notes={notes}
        addNote={addNote}
        bringToFront={bringToFront}
        updateNotePosition={updateNotePosition}
        updateNoteSize={updateNoteSize}
        deleteNote={deleteNote}
      />
    </div>
  )
}

export default App
