import type { Dimensions, Position } from '../types/note'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

// Normalizes a drag in any direction into a rectangle with positive dimensions.
export function getRectFromPoints(a: Position, b: Position): Position & Dimensions {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  }
}

export function isPointInRect(point: Position, rect: DOMRect): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
}
