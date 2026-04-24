# SlotPaste

A macOS clipboard manager built for job search workflows — store text snippets, copy on click, organize in tabs.

<!-- TODO: screenshot or demo gif -->

---

## Why

Filling out job applications means pasting the same blocks of text dozens of times a day. SlotPaste keeps them one click away, organized the way you think, without leaving your flow.

## Features

**Tabs**
- Create, rename (double-click), switch, reorder (drag), delete (long press → confirm)
- Auto-focuses name input on creation
- List or canvas mode per tab, persisted across restarts

**Blocks**
- Add, copy on click, delete (long press → wiggle → confirm)
- Edit popup: font size, per-block color, delete — flies out from block position
- Resize (width + height) via drag handle
- Color picker: swatches + color wheel

**Free Canvas**
- 10 000 × 10 000 canvas — drag blocks freely, pan, zoom (scroll wheel)
- CENTER button — animated return to center
- Camera follows new blocks and tab switches smoothly
- Entrance animation (spring + glow)
- Collision detection: blocks never overlap on add, drag, or resize (R-tree + aggregate MTV)
- Scale-aware resize: cursor and block edge stay in sync at any zoom level

**List Mode**
- Vertical scrollable list with drag-to-reorder

**Appearance**
- Background and block color + opacity
- macOS vibrancy (under-window blur)

**System**
- Tray icon — click to show/hide
- Global shortcut `⌘⇧V` — show/hide from anywhere
- ⌘W hides the window instead of quitting
- Launch at login (optional, off by default)
- Window size persisted across restarts

## Tech stack

- **Electron** — main process, IPC, tray, global shortcut
- **React 18** + **TypeScript**
- **Vite** + `vite-plugin-electron`
- **electron-store** — persistent JSON storage
- **@dnd-kit** — drag-and-drop for blocks and tabs
- **framer-motion** — animations
- **Tailwind CSS** — styling
- **rbush** — R-tree spatial index for collision detection

## Dev

```bash
pnpm dev      # Vite dev server + Electron
pnpm build    # TypeScript build + .dmg via electron-builder
pnpm lint     # ESLint + TypeScript check
```

Icon regeneration (run after changing `public/SlotPaste.svg`):

```bash
node scripts/gen-icons.mjs
```

## License

MIT © Kostiantyn Keilin