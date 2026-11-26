# Sticky Notes TS

A single-page sticky notes board built with React and TypeScript, without UI, drag-and-drop or icon libraries.

## Features

| Feature | How |
| :--- | :--- |
| Create a note of a given size and position | Drag on empty board space to draw it, double-click for a default-size note, or use **New Note** |
| Resize a note | Drag the bottom-right corner (or <kbd>Shift</kbd> + arrow keys) |
| Move a note | Drag it by its header or edges (or arrow keys) |
| Remove a note | Drop it on the trash zone (or the note's ✕ button, or <kbd>Delete</kbd>) |
| Bonus I — Edit text | Click the note body, or press <kbd>Enter</kbd> on a focused note (<kbd>Escape</kbd> leaves) |
| Bonus II — Bring to front | Any interaction with a note raises it above the others |
| Bonus III — Local storage | Notes are saved automatically and restored on page load |
| Bonus IV — Colors | Color swatches in the note header (visible on hover or focus) |
| Bonus V — REST API | Changes are synced to an asynchronous mock API; the toolbar shows the save status |

## Getting started

Requirements: Node.js `^20.19.0 || >=22.12.0` and npm.

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run build    # type-check (tsc -b) and build for production into dist/
npm run preview  # serve the production build
npm run lint     # run oxlint
```

Supported browsers: latest Chrome, Firefox and Edge on desktop, minimum resolution 1024×768. Smaller windows (for example with DevTools docked or a high zoom level) keep working: a notice is shown and the page scrolls instead of clipping, and notes placed in a larger window are displayed inside the visible board without changing their saved position.

## Testing

End-to-end tests use [Playwright](https://playwright.dev) and run against the dev server in Chromium and Firefox, and on demand in Microsoft Edge:

```bash
npx playwright install chromium firefox   # first run only: downloads the test browsers
npm run test:e2e                          # Chromium + Firefox; starts the dev server if needed
npm run test:e2e:edge                     # same suite in the installed Microsoft Edge
npx playwright test --ui                  # optional: interactive runner
```

The Edge project drives the real, installed browser (`npx playwright install msedge` installs it if missing), so it is kept out of the default run.

The suite (`e2e/`) covers note creation (drawing, double-click, toolbar), moving, resizing, bringing to front, deleting through the trash zone, persistence across reloads, keyboard operation with screen reader announcements, the trash zone as a restricted area, and small-window behavior. Requests outside `localhost` are blocked, so the tests never depend on the network.

## Architecture

The app is split into layers with one-way dependencies: domain types and constants at the bottom, a services layer for persistence, custom hooks for state and behavior, and presentational components on top. `useNotesManager` is the single source of truth: it holds the notes array, hydrates it synchronously from `localStorage` on start and exposes stable, immutable CRUD actions (`addNote`, `bringToFront`, `updateNotePosition`, …) built on functional state updates. Every change is persisted after a 500 ms debounce to both `localStorage` and an asynchronous mock REST client, so continuous gestures don't flood storage; stale sync responses are ignored, pending changes are flushed on `pagehide`, and data read back from storage is validated with runtime type guards instead of being trusted.

Interactions are implemented with the native Pointer Events API rather than HTML5 drag and drop. Notes only report where a gesture starts; the board then captures the pointer (`setPointerCapture`), so moves and releases keep arriving even when the cursor outruns the note or leaves the window. The gesture lifecycle is a discriminated union (`idle | creating | dragging | resizing`) in `usePointerInteraction`, which rules out impossible states such as resizing and dragging at once. Placement is pure geometry in `utils/geometry.ts`, driven by constants rather than DOM measurements: a dragged note is marked for deletion as soon as its rectangle overlaps the trash zone (axis-aligned bounding box test), and the trash is a restricted area for resting notes, so creation, resizing, keyboard moves and window shrinking all keep notes inside the board and out of it. Notes are positioned with `transform: translate3d` to avoid layout reflows.

Performance comes from rendering only what changes: `StickyNote` is memoized, every callback it receives is stable (`useCallback` plus refs for fresh state), and updates preserve the object identity of untouched notes, so dragging one note re-renders only that note. Styling uses CSS Modules on top of design tokens declared as CSS custom properties, with inline SVG icons. TypeScript runs in strict mode with `noUncheckedIndexedAccess`, and the code uses no `any`, type assertions or non-null assertions. Every pointer action also has a keyboard equivalent (`useNoteKeyboard`), screen readers are informed through polite and assertive live regions (`useAnnouncer`), and color pairs meet WCAG 2.1 AA contrast.

## Keyboard

| Key | On a focused note |
| :--- | :--- |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Move between notes and their controls |
| Arrow keys | Move the note by 16 px |
| <kbd>Shift</kbd> + arrow keys | Resize the note by 16 px |
| <kbd>Enter</kbd> / <kbd>Escape</kbd> | Start / stop editing the text |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | Delete the note (focus moves to a neighbouring note or to **New Note**) |

## Project structure

```text
src/
├── components/   Board, StickyNote, Toolbar, TrashZone, LiveAnnouncer, Icons
├── hooks/        useNotesManager, usePointerInteraction, useNoteKeyboard, useAnnouncer
├── services/     storageService, mockApiService, noteValidation
├── constants/    note sizes and palette, storage keys, accessibility ids
├── types/        Note, PointerInteraction, SyncStatus, Announcement
├── utils/        geometry helpers (clamp, rectangles, hit testing)
└── styles/       theme.css (design tokens and global styles)
```
