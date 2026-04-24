# SlotPaste

A macOS desktop clipboard manager built for job search workflows — store text snippets (cover letters, skills, links), copy on click, organize in tabs.

> **Status**: In development. Core features working — not yet packaged for distribution.

---

<!-- TODO: screenshot or demo gif -->

## Why

Filling out job applications means pasting the same blocks of text dozens of times a day. SlotPaste keeps them one click away, organized the way you think, without leaving your flow.

## Features

### Done
- Tabs: create, rename (double-click), switch, reorder (drag), delete (long press → confirm)
- New tab auto-focuses the name input on creation
- Blocks: add, edit, delete (long press → wiggle → confirm), copy on click
- Block resize (width + height)
- Font size and per-block color in edit popup
- Edit popup: flies out from block position, full-width overlay, confirm on unsaved changes
- Free canvas (10 000 × 10 000): drag blocks freely, pan, zoom (scroll wheel)
- CENTER button — animated return to canvas center
- New blocks placed below the last added block; camera follows smoothly
- Smooth camera transition when switching tabs
- Block entrance animation (spring + glow)
- Color picker in AddBlock (swatches + color wheel, above the input)
- Appearance panel: background and block color + opacity
- Tab drag-and-drop sorting
- SF Pro system font (no external import)
- Collision detection: blocks never overlap — R-tree spatial index (rbush) + aggregate MTV resolution; snap animation on drag/resize; ResizeObserver for accurate real-time bounding boxes
- Scale-aware resize: cursor and block edge stay in sync at any zoom level

### Planned
- List / canvas mode toggle per tab
- Block grouping on canvas
- Tray icon + global shortcut (⌘⇧V) to show/hide
- Frameless window with native macOS traffic lights
- `.dmg` build

## Tech stack

- **Electron** — main process, IPC, tray, global shortcut
- **React 18** + **TypeScript**
- **Vite** via `electron-vite`
- **electron-store** — persistent JSON storage
- **@dnd-kit** — drag-and-drop
- **framer-motion** — animations
- **Tailwind CSS** — styling
- **rbush** — R-tree spatial index for collision detection

## Dev commands

```bash
pnpm dev      # Vite dev server + Electron
pnpm build    # TypeScript build + electron-builder
pnpm lint     # ESLint + TypeScript check
```

## License

MIT © Kostiantyn Keilin