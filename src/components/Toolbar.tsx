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

interface ToolbarProps {
  syncStatus: SyncStatus
  onAddNote: () => void
}

/**
 * The sync status is intentionally not a live region: announcing every save while typing
 * would be noisy, so only failures are announced (see `App`).
 */
export function Toolbar({ syncStatus, onAddNote }: ToolbarProps) {
  return (
    <header className={styles.banner}>
      <div className={styles.toolbar}>
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
      </div>
      <p className={styles.screenNotice}>
        Sticky Notes is designed for screens of at least 1024×768. Some areas may need scrolling.
      </p>
    </header>
  )
}
