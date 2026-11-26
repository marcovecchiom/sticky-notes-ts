import type { Dimensions, Position } from '../types/note'

/**
 * Constrains a value to a range. If `max` is lower than `min`, `min` wins.
 *
 * @param {number} value - Value to constrain.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns {number} The value limited to `[min, max]`.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

/**
 * Normalizes a drag in any direction into a rectangle with positive dimensions.
 *
 * @param {Position} a - Point where the drag started.
 * @param {Position} b - Point where the drag currently is.
 * @returns {Position & Dimensions} Top-left corner and size of the rectangle spanned by both points.
 */
export function getRectFromPoints(a: Position, b: Position): Position & Dimensions {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  }
}

/**
 * Axis-aligned hit test of a point against a DOM rectangle (edges included).
 *
 * @param {Position} point - Point in viewport coordinates.
 * @param {DOMRect} rect - Rectangle from `getBoundingClientRect()`.
 * @returns {boolean} `true` if the point lies inside the rectangle.
 */
export function isPointInRect(point: Position, rect: DOMRect): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
}
