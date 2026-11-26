import { MIN_HEIGHT, MIN_WIDTH } from '../constants/notes'
import { TRASH_ZONE } from '../constants/trash'
import type { Dimensions, Position, Rect } from '../types/note'

/** If `max` is below `min` (e.g. a note wider than the board), `min` wins. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

/** Normalizes a drag in any direction (up or left too) into a rectangle with positive size. */
export function getRectFromPoints(a: Position, b: Position): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  }
}

export function getElementSize(element: HTMLElement): Dimensions {
  return { width: element.clientWidth, height: element.clientHeight }
}

/** Axis-aligned bounding box overlap; rectangles that only share an edge do not intersect. */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

export function getTrashRect(board: Dimensions): Rect {
  return {
    x: board.width - TRASH_ZONE.margin - TRASH_ZONE.width,
    y: board.height - TRASH_ZONE.margin - TRASH_ZONE.height,
    width: TRASH_ZONE.width,
    height: TRASH_ZONE.height,
  }
}

export function clampToBoard(rect: Rect, board: Dimensions): Position {
  return {
    x: clamp(rect.x, 0, board.width - rect.width),
    y: clamp(rect.y, 0, board.height - rect.height),
  }
}

/**
 * Resting position of a note: inside the board and outside the trash zone, which no note may
 * cover. An overlapping note is pushed left or up, whichever is the shorter move.
 */
export function placeInBoard(rect: Rect, board: Dimensions): Position {
  const position = clampToBoard(rect, board)
  const trash = getTrashRect(board)
  if (!rectsIntersect({ ...rect, ...position }, trash)) return position

  const candidates = [
    { x: trash.x - rect.width, y: position.y },
    { x: position.x, y: trash.y - rect.height },
  ].filter((candidate) => candidate.x >= 0 && candidate.y >= 0)
  const distance = (candidate: Position) => Math.abs(candidate.x - position.x) + Math.abs(candidate.y - position.y)
  return candidates.reduce<Position | null>(
    (best, candidate) => (best === null || distance(candidate) < distance(best) ? candidate : best),
    null,
  ) ?? position
}

/**
 * Limits a requested size to the minimum, the board edges and the trash zone. When the note
 * would grow into the trash, it is cut on whichever axis yields a valid size, keeping the
 * larger area if both do.
 */
export function constrainSize(position: Position, size: Dimensions, board: Dimensions): Dimensions {
  const width = clamp(size.width, MIN_WIDTH, board.width - position.x)
  const height = clamp(size.height, MIN_HEIGHT, board.height - position.y)
  const trash = getTrashRect(board)
  if (!rectsIntersect({ ...position, width, height }, trash)) return { width, height }

  const options = [
    { width: trash.x - position.x, height },
    { width, height: trash.y - position.y },
  ].filter((option) => option.width >= MIN_WIDTH && option.height >= MIN_HEIGHT)
  const area = (option: Dimensions) => option.width * option.height
  return (
    options.reduce<Dimensions | null>((best, option) => (best === null || area(option) > area(best) ? option : best), null) ?? {
      width: Math.max(MIN_WIDTH, Math.min(width, trash.x - position.x)),
      height: Math.max(MIN_HEIGHT, Math.min(height, trash.y - position.y)),
    }
  )
}
