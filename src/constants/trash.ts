import type { Dimensions } from '../types/note'

// Single source for the trash zone geometry: it is rendered from these values and used for
// hit testing and placement, so no DOM measurement (or hover scaling) is involved.
export const TRASH_ZONE: Dimensions & { margin: number } = {
  width: 148,
  height: 112,
  margin: 24,
}
