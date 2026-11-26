export type Politeness = 'polite' | 'assertive'

export interface Announcement {
  message: string
  politeness: Politeness
  /** Incremented on every announcement so identical consecutive messages are read again. */
  id: number
}

export type Announce = (message: string, politeness?: Politeness) => void
