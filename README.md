# SlotPaste

A macOS desktop clipboard manager built for job search workflows — store text snippets (cover letters, skills, links), copy on click, organize in tabs.

> **Status**: In development. Not yet functional.

---

<!-- TODO: screenshot or demo gif -->

## Why

Filling out job applications means pasting the same blocks of text dozens of times a day. SlotPaste keeps them one click away, organized the way you think, without leaving your flow.

## Features

### Done
- Tabs: create, rename, switch
- Blocks: add, edit, delete, copy on click
- Block resize (width + height)
- Font size and per-block color in edit popup
- Edit popup: flies out from block position, full-width overlay, confirm on unsaved changes
- Free canvas: drag blocks to any position, persisted across sessions

### Planned
- Tab drag-and-drop sorting
- Appearance panel: background and block color + opacity
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

## Dev commands

```bash
pnpm dev      # Vite dev server + Electron
pnpm build    # TypeScript build + electron-builder
pnpm lint     # ESLint + TypeScript check
```

## License

MIT © Kostiantyn Keilin