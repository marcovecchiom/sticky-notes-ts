import type { Announcement } from '../types/announcement'

/**
 * Props of `LiveAnnouncer`.
 *
 * @property {Announcement | null} announcement - Latest message to read, if any.
 */
interface LiveAnnouncerProps {
  announcement: Announcement | null
}

/**
 * Visually hidden polite and assertive live regions. Both are always mounted so
 * screen readers pick up changes; the message is keyed by id so repeated messages
 * replace the node and are read again.
 *
 * @param {LiveAnnouncerProps} props - Latest announcement.
 * @returns {JSX.Element} The two live regions.
 */
export function LiveAnnouncer({ announcement }: LiveAnnouncerProps) {
  const renderMessage = (politeness: Announcement['politeness']) =>
    announcement?.politeness === politeness ? <span key={announcement.id}>{announcement.message}</span> : null

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {renderMessage('polite')}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {renderMessage('assertive')}
      </div>
    </>
  )
}
