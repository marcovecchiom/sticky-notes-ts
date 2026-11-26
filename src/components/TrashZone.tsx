import type { Ref } from 'react'
import { TrashIcon } from './Icons'
import styles from './TrashZone.module.css'

interface TrashZoneProps {
  ref: Ref<HTMLDivElement>
  isVisible: boolean
  isHovered: boolean
}

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
