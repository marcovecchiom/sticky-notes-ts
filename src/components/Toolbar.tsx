import { NEW_NOTE_BUTTON_ID } from '../constants/a11y'
import type { SyncStatus } from '../types/sync'
import { PlusIcon } from './Icons'
import styles from './Toolbar.module.css'

const SYNC_LABELS: Record<SyncStatus, string> = {
  idle: 'All changes saved',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Could not save changes',
}

/**
 * Props of `Toolbar`.
 *
 * @property {SyncStatus} syncStatus - Current persistence state.
 * @property {() => void} onAddNote - Creates a default note.
 */
interface ToolbarProps {
  syncStatus: SyncStatus
  onAddNote: () => void
}

/**
 * Top bar (banner landmark) with the app title, the "New Note" button, usage hints
 * and the sync status. The status is not a live region: announcing every save while
 * typing would be noisy, so only failures are announced (see `App`).
 *
 * @param {ToolbarProps} props - Sync status and add-note callback.
 * @returns {JSX.Element} The toolbar element.
 */
export function Toolbar({ syncStatus, onAddNote }: ToolbarProps) {
  return (
    <header className={styles.toolbar}>
      <h1 className={styles.title}>Sticky Notes</h1>
      <button id={NEW_NOTE_BUTTON_ID} type="button" className={styles.addButton} onClick={onAddNote}>
        <PlusIcon />
        New Note
      </button>
      <p className={styles.hint}>or drag on the board to draw one · double-click for a default note</p>
      <span className={styles.status} data-status={syncStatus}>
        <span className={styles.statusDot} aria-hidden="true" />
        {SYNC_LABELS[syncStatus]}
      </span>
    </header>
  )
}
