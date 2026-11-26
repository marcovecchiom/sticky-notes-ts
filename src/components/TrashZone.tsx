import { TRASH_ZONE } from '../constants/trash'
import { TrashIcon } from './Icons'
import styles from './TrashZone.module.css'

interface TrashZoneProps {
  isVisible: boolean
  isHovered: boolean
}

/**
 * Hidden from assistive technologies because it is pointer-only; keyboard users delete
 * notes with the Delete key or the note's delete button.
 */
export function TrashZone({ isVisible, isHovered }: TrashZoneProps) {
  const className = [styles.trash, isVisible && styles.visible, isHovered && styles.hovered]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      style={{
        width: TRASH_ZONE.width,
        height: TRASH_ZONE.height,
        right: TRASH_ZONE.margin,
        bottom: TRASH_ZONE.margin,
      }}
      aria-hidden="true"
    >
      <TrashIcon />
      <span>{isHovered ? 'Release to delete' : 'Drop here to delete'}</span>
    </div>
  )
}
