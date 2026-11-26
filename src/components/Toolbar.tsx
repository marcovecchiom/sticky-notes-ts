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

export function Toolbar({ syncStatus, onAddNote }: ToolbarProps) {
  return (
    <header className={styles.toolbar}>
      <h1 className={styles.title}>Sticky Notes</h1>
      <button type="button" className={styles.addButton} onClick={onAddNote}>
        <PlusIcon />
        New Note
      </button>
      <p className={styles.hint}>or drag on the board to draw one · double-click for a default note</p>
      <span className={styles.status} data-status={syncStatus} role="status">
        <span className={styles.statusDot} />
        {SYNC_LABELS[syncStatus]}
      </span>
    </header>
  )
}
