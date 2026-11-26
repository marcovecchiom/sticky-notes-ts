import { board, boxOf, drag, drawNote, expect, expectNear, intersects, noteBounds, notes, test, trashBox } from './fixtures'
import type { Locator, Page } from '@playwright/test'
import type { Box } from './fixtures'

// Retries because the board re-measures itself (ResizeObserver) a frame after the window changes.
async function expectInsideBoardAndOutOfTrash(page: Page, note: Locator) {
  await expect(async () => {
    const area = await boxOf(board(page))
    const box: Box = await boxOf(note)
    expect(box.x).toBeGreaterThanOrEqual(area.x - 1)
    expect(box.y).toBeGreaterThanOrEqual(area.y - 1)
    expect(box.x + box.width).toBeLessThanOrEqual(area.x + area.width + 1)
    expect(box.y + box.height).toBeLessThanOrEqual(area.y + area.height + 1)
    expect(intersects(box, await trashBox(page))).toBe(false)
  }).toPass({ timeout: 2000 })
}

test.describe('trash zone as a restricted area', () => {
  test('a note never ends up behind the trash when the window shrinks, and returns when it grows', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 })
    await drawNote(page, { x: 1150, y: 600 }, { x: 1400, y: 800 })
    const note = notes(page).first()

    await page.setViewportSize({ width: 1100, height: 700 })
    await expectInsideBoardAndOutOfTrash(page, note)

    await page.setViewportSize({ width: 1600, height: 1000 })
    await expect(async () => {
      const bounds = await noteBounds(page, note)
      expectNear(bounds.x, 1150)
      expectNear(bounds.y, 600)
    }).toPass({ timeout: 2000 })
  })

  test('a note drawn over the trash is placed outside it', async ({ page }) => {
    const area = await boxOf(board(page))
    await drawNote(page, { x: area.width - 380, y: area.height - 290 }, { x: area.width - 100, y: area.height - 40 })

    await expect(notes(page)).toHaveCount(1)
    await expectInsideBoardAndOutOfTrash(page, notes(page).first())
  })

  test('resizing toward the trash stops at its edge', async ({ page }) => {
    const area = await boxOf(board(page))
    const trash = await trashBox(page)
    const left = trash.x - area.x - 100
    await drawNote(page, { x: left, y: 200 }, { x: left + 200, y: 350 })
    const note = notes(page).first()
    const box = await boxOf(note)
    const corner = { x: box.x + box.width - 6, y: box.y + box.height - 6 }

    // Ends past the trash edge but inside the viewport: Playwright's Firefox driver drops the
    // whole move when its end point lies outside the window.
    const viewportHeight = page.viewportSize()?.height ?? 0
    await drag(page, corner, { x: corner.x, y: viewportHeight - 5 })

    await expectInsideBoardAndOutOfTrash(page, note)
    const resized = await boxOf(note)
    expectNear(resized.y + resized.height, trash.y)
  })
})

test.describe('small windows', () => {
  const notice = (page: Page) => page.getByText(/designed for screens of at least 1024×768/)

  test('shows a notice below the supported size and hides it above', async ({ page }) => {
    await expect(notice(page)).toBeHidden()

    await page.setViewportSize({ width: 900, height: 700 })
    await expect(notice(page)).toBeVisible()
  })

  test('scrolls instead of clipping the board', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 500 })
    const area = await boxOf(board(page))

    expect(area.width).toBeGreaterThanOrEqual(1024)
    const scrollable = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth && document.documentElement.scrollHeight > window.innerHeight,
    )
    expect(scrollable).toBe(true)
  })
})
