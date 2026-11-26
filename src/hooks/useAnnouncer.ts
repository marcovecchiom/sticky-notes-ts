import { useCallback, useRef, useState } from 'react'
import type { Announce, Announcement } from '../types/announcement'

/**
 * Keeps the latest screen reader announcement for `LiveAnnouncer` to render.
 *
 * @returns {{ announcement: Announcement | null, announce: Announce }} The latest
 * announcement and a stable function to emit a new one (`'polite'` by default).
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const counterRef = useRef(0)

  const announce = useCallback<Announce>((message, politeness = 'polite') => {
    counterRef.current += 1
    setAnnouncement({ message, politeness, id: counterRef.current })
  }, [])

  return { announcement, announce }
}
