import { useCallback } from 'react'
import styles from './App.module.css'
import { Board } from './components/Board'
import { Toolbar } from './components/Toolbar'
import { DEFAULT_DIMENSIONS } from './constants/notes'
import { useNotesManager } from './hooks/useNotesManager'

const NEW_NOTE_ORIGIN = 32
const NEW_NOTE_CASCADE_STEP = 24
const NEW_NOTE_CASCADE_LENGTH = 10

/**
 * Root component: connects the notes store with the toolbar and the board.
 *
 * @returns {JSX.Element} The application layout.
 */
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

  /**
   * Adds a default note from the toolbar. Cascades consecutive notes so they do not
   * fully overlap.
   *
   * @returns {void}
   */
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
        updateNoteText={updateNoteText}
        updateNoteColor={updateNoteColor}
      />
    </div>
  )
}

export default App
