import type { Announcement } from '../types/announcement'

interface LiveAnnouncerProps {
  announcement: Announcement | null
}

/**
 * Both regions stay mounted because screen readers only announce changes to existing live
 * regions; keying the message by id makes repeated messages be read again.
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
