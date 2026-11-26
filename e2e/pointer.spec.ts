import {
  board,
  boxOf,
  drag,
  drawNote,
  expect,
  expectNear,
  gripPoint,
  noteBounds,
  notes,
  test,
  trashBox,
} from './fixtures'

test.describe('creating notes', () => {
  test('draws a note with the exact size and position', async ({ page }) => {
    await drawNote(page, { x: 100, y: 80 }, { x: 420, y: 330 })

    await expect(notes(page)).toHaveCount(1)
    const bounds = await noteBounds(page, notes(page).first())
    expectNear(bounds.x, 100)
    expectNear(bounds.y, 80)
    expectNear(bounds.width, 320)
    expectNear(bounds.height, 250)
  })

  test('draws a note in any direction', async ({ page }) => {
    await drawNote(page, { x: 420, y: 330 }, { x: 100, y: 80 })

    const bounds = await noteBounds(page, notes(page).first())
    expectNear(bounds.x, 100)
    expectNear(bounds.y, 80)
  })

  test('ignores tiny drags and enlarges small drawings to the minimum size', async ({ page }) => {
    await drawNote(page, { x: 100, y: 100 }, { x: 120, y: 120 })
    await expect(notes(page)).toHaveCount(0)

    await drawNote(page, { x: 100, y: 100 }, { x: 160, y: 160 })
    const bounds = await noteBounds(page, notes(page).first())
    expectNear(bounds.width, 150)
    expectNear(bounds.height, 150)
  })

  test('double-click creates a default-size note centred on the cursor', async ({ page }) => {
    const area = await boxOf(board(page))
    await page.mouse.dblclick(area.x + 400, area.y + 300)

    const bounds = await noteBounds(page, notes(page).first())
    expectNear(bounds.x, 290)
    expectNear(bounds.y, 190)
    expectNear(bounds.width, 220)
    expectNear(bounds.height, 220)
  })

  test('New Note button creates a note ready to type in', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click()

    await expect(notes(page)).toHaveCount(1)
    await expect(page.getByRole('textbox', { name: 'Note text' })).toBeFocused()
  })

  test('double-clicking a note or its text does not create another note', async ({ page }) => {
    await drawNote(page, { x: 100, y: 100 }, { x: 320, y: 320 })
    const note = notes(page).first()

    const grip = await gripPoint(note)
    await page.mouse.dblclick(grip.x, grip.y)
    await note.getByRole('textbox', { name: 'Note text' }).dblclick()

    await expect(notes(page)).toHaveCount(1)
  })
})

test.describe('moving and resizing', () => {
  test('moves a note by dragging its header', async ({ page }) => {
    await drawNote(page, { x: 100, y: 100 }, { x: 320, y: 320 })
    const note = notes(page).first()

    const grip = await gripPoint(note)
    await drag(page, grip, { x: grip.x + 200, y: grip.y + 150 })

    const bounds = await noteBounds(page, note)
    expectNear(bounds.x, 300)
    expectNear(bounds.y, 250)
  })

  test('resizes a note from its corner, never below the minimum size', async ({ page }) => {
    await drawNote(page, { x: 100, y: 100 }, { x: 320, y: 320 })
    const note = notes(page).first()
    const box = await boxOf(note)
    const corner = { x: box.x + box.width - 6, y: box.y + box.height - 6 }

    await drag(page, corner, { x: corner.x + 80, y: corner.y + 60 })
    let bounds = await noteBounds(page, note)
    expectNear(bounds.width, 300)
    expectNear(bounds.height, 280)

    const grown = await boxOf(note)
    const newCorner = { x: grown.x + grown.width - 6, y: grown.y + grown.height - 6 }
    await drag(page, newCorner, { x: newCorner.x - 500, y: newCorner.y - 500 })
    bounds = await noteBounds(page, note)
    expectNear(bounds.width, 150)
    expectNear(bounds.height, 150)
  })

  test('brings a note to the front when it is grabbed', async ({ page }) => {
    await drawNote(page, { x: 100, y: 100 }, { x: 320, y: 320 })
    // Drawn from its free corner: a press on an existing note would drag it instead.
    await drawNote(page, { x: 420, y: 420 }, { x: 200, y: 200 })
    const [lower, upper] = [notes(page).nth(0), notes(page).nth(1)]
    const zIndex = (note: typeof lower) => note.evaluate((element) => Number(getComputedStyle(element).zIndex))

    expect(await zIndex(upper)).toBeGreaterThan(await zIndex(lower))
    const grip = await gripPoint(lower)
    await page.mouse.click(grip.x, grip.y)
    expect(await zIndex(lower)).toBeGreaterThan(await zIndex(upper))
  })
})

test.describe('trash zone', () => {
  test('deletes a note when only its corner overlaps the trash', async ({ page }) => {
    await drawNote(page, { x: 100, y: 100 }, { x: 320, y: 320 })
    const note = notes(page).first()
    const trash = await trashBox(page)
    const box = await boxOf(note)
    const grip = await gripPoint(note)
    // Target: the note's bottom-right corner 20px inside the trash, the pointer far outside it.
    const dx = trash.x - box.width + 20 - box.x
    const dy = trash.y - box.height + 20 - box.y

    await page.mouse.move(grip.x, grip.y)
    await page.mouse.down()
    await page.mouse.move(grip.x + dx, grip.y + dy, { steps: 12 })
    await expect(page.getByText('Release to delete', { exact: true })).toBeVisible()
    await page.mouse.up()

    await expect(notes(page)).toHaveCount(0)
  })

  test('keeps a note dropped right next to the trash', async ({ page }) => {
    await drawNote(page, { x: 100, y: 100 }, { x: 320, y: 320 })
    const note = notes(page).first()
    const trash = await trashBox(page)
    const box = await boxOf(note)
    const grip = await gripPoint(note)

    await drag(page, grip, { x: grip.x + trash.x - box.width - 10 - box.x, y: grip.y + trash.y - box.height - 10 - box.y })

    await expect(notes(page)).toHaveCount(1)
  })
})

test.describe('editing and persistence', () => {
  test('keeps text and color after a reload', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click()
    const note = notes(page).first()
    await note.getByRole('textbox', { name: 'Note text' }).fill('Buy milk')
    await note.getByRole('button', { name: 'Sky' }).click()
    await expect(page.getByText('Saved', { exact: true })).toBeVisible()

    await page.reload()

    const restored = notes(page).first()
    await expect(restored.getByRole('textbox', { name: 'Note text' })).toHaveValue('Buy milk')
    await expect(restored).toHaveAttribute('aria-label', 'Sticky note: Buy milk')
    await expect(restored).toHaveCSS('background-color', 'rgb(84, 206, 249)')
    await expect(restored.getByRole('button', { name: 'Sky' })).toHaveAttribute('aria-pressed', 'true')
  })
})
