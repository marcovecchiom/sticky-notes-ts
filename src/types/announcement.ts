/** How urgently a screen reader should read an announcement. */
export type Politeness = 'polite' | 'assertive'

/**
 * A message for screen readers.
 *
 * @property {string} message - Text to read.
 * @property {Politeness} politeness - Live region that reads it.
 * @property {number} id - Increasing counter, so identical consecutive messages are read again.
 */
export interface Announcement {
  message: string
  politeness: Politeness
  id: number
}

/** Function that sends a message to the live regions. */
export type Announce = (message: string, politeness?: Politeness) => void
