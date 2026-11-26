import type { Page } from '@playwright/test'
import { drawNote, expect, expectNear, noteBounds, notes, test } from './fixtures'

const politeRegion = (page: Page) => page.locator('[aria-live="polite"]')

test.describe('keyboard operation', () => {
  test.beforeEach(async ({ page }) => {
    await drawNote(page, { x: 100, y: 100 }, { x: 320, y: 320 })
  })

  test('arrow keys move the note and announce its position', async ({ page }) => {
    const note = notes(page).first()
    await note.focus()

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')

    const bounds = await noteBounds(page, note)
    expectNear(bounds.x, 116)
    expectNear(bounds.y, 116)
    await expect(politeRegion(page)).toHaveText('Moved to X 116, Y 116')
  })

  test('Shift + arrow keys resize the note', async ({ page }) => {
    const note = notes(page).first()
    await note.focus()

    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('Shift+ArrowUp')

    const bounds = await noteBounds(page, note)
    expectNear(bounds.width, 236)
    expectNear(bounds.height, 204)
    await expect(politeRegion(page)).toHaveText('Resized to 236 by 204 pixels')
  })

  test('Enter edits the text, Escape returns to the card, and typing never moves the note', async ({ page }) => {
    const note = notes(page).first()
    const text = note.getByRole('textbox', { name: 'Note text' })
    await note.focus()

    await page.keyboard.press('Enter')
    await expect(text).toBeFocused()
    await page.keyboard.type('Hello')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Backspace')
    await expect(text).toHaveValue('Helo')
    await expect(notes(page)).toHaveCount(1)

    await page.keyboard.press('Escape')
    await expect(note).toBeFocused()
    const bounds = await noteBounds(page, note)
    expectNear(bounds.x, 100)
  })

  test('Delete removes the focused note and keeps focus on the page', async ({ page }) => {
    await drawNote(page, { x: 400, y: 100 }, { x: 620, y: 320 })
    const [first, second] = [notes(page).nth(0), notes(page).nth(1)]
    const firstId = await first.getAttribute('data-note-id')

    await second.focus()
    await page.keyboard.press('Delete')
    await expect(notes(page)).toHaveCount(1)
    await expect(page.locator(`[data-note-id="${firstId}"]`)).toBeFocused()
    await expect(politeRegion(page)).toHaveText('Sticky note deleted')

    await page.keyboard.press('Delete')
    await expect(notes(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'New Note' })).toBeFocused()
  })

  test('the delete button removes the note', async ({ page }) => {
    await notes(page).first().getByRole('button', { name: 'Delete note' }).click()

    await expect(notes(page)).toHaveCount(0)
  })
})
