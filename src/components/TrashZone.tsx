import type { Ref } from 'react'
import { TrashIcon } from './Icons'
import styles from './TrashZone.module.css'

/**
 * Props of `TrashZone`.
 *
 * @property {Ref<HTMLDivElement>} ref - Element used for the drop hit test.
 * @property {boolean} isVisible - Whether a note is being dragged.
 * @property {boolean} isHovered - Whether the dragged note is over the zone.
 */
interface TrashZoneProps {
  ref: Ref<HTMLDivElement>
  isVisible: boolean
  isHovered: boolean
}

/**
 * Drop zone in the bottom-right corner that deletes the note released over it.
 *
 * @param {TrashZoneProps} props - Ref and visual state.
 * @returns {JSX.Element} The trash zone element.
 */
export function TrashZone({ ref, isVisible, isHovered }: TrashZoneProps) {
  const className = [styles.trash, isVisible && styles.visible, isHovered && styles.hovered]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={ref} className={className} aria-hidden={!isVisible}>
      <TrashIcon />
      <span>{isHovered ? 'Release to delete' : 'Drop here to delete'}</span>
    </div>
  )
}
