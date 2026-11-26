import { test as base, expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { TRASH_ZONE } from '../src/constants/trash'

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export const test = base.extend({
  page: async ({ page }, provide) => {
    // Keeps the suite hermetic: only the local app is reachable (web fonts fall back to system fonts).
    await page.route(/^(?!http:\/\/localhost[:/])/, (route) => route.abort())
    await page.goto('/')
    await provide(page)
  },
})

export { expect }

export const board = (page: Page) => page.getByRole('main', { name: 'Sticky notes workspace' })
export const notes = (page: Page) => page.locator('[data-note-id]')

export async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox()
  if (!box) throw new Error('Element is not visible')
  return box
}

export async function trashBox(page: Page): Promise<Box> {
  const area = await boxOf(board(page))
  return {
    x: area.x + area.width - TRASH_ZONE.margin - TRASH_ZONE.width,
    y: area.y + area.height - TRASH_ZONE.margin - TRASH_ZONE.height,
    width: TRASH_ZONE.width,
    height: TRASH_ZONE.height,
  }
}

export function intersects(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

export async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 12 })
  await page.mouse.up()
}

/** Draws a note on the board; coordinates are relative to the board's top-left corner. */
export async function drawNote(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const area = await boxOf(board(page))
  await drag(page, { x: area.x + from.x, y: area.y + from.y }, { x: area.x + to.x, y: area.y + to.y })
}

/** Centre of the drag grip in the note header: a spot that starts a drag, not a control. */
export async function gripPoint(note: Locator) {
  const grip = await boxOf(note.locator('header > svg'))
  return { x: grip.x + grip.width / 2, y: grip.y + grip.height / 2 }
}

/** Layout assertions allow sub-pixel rounding differences between browsers. */
export function expectNear(actual: number, expected: number, tolerance = 1.5) {
  expect(Math.abs(actual - expected), `expected ${actual} to be within ${tolerance}px of ${expected}`).toBeLessThanOrEqual(
    tolerance,
  )
}

/** Note bounds relative to the board, the coordinate system the app stores. */
export async function noteBounds(page: Page, note: Locator): Promise<Box> {
  const area = await boxOf(board(page))
  const box = await boxOf(note)
  return { x: box.x - area.x, y: box.y - area.y, width: box.width, height: box.height }
}
