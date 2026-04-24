# SlotPaste

A web clipboard manager built for job search workflows — store text snippets, copy on click, organize in tabs.

---

## Why

Filling out job applications means pasting the same blocks of text dozens of times a day. SlotPaste keeps them one click away, organized the way you think, without leaving your flow.

## Features

**Tabs**
- Create, rename (double-click), switch, reorder (drag), delete (long press → confirm)
- Auto-focuses name input on creation

**Blocks**
- Add, copy on click, delete (long press → wiggle → confirm)
- Edit popup: font size, per-block color, delete
- Resize (width + height) via drag handle
- Color picker: swatches + color wheel
- List or canvas mode per tab, persisted across sessions

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
- Background color, block color + opacity, accent color (borders, icons)

## Tech stack

- **React 18** + **TypeScript**
- **Vite**
- **localStorage** — persistent state (debounced writes)
- **@dnd-kit** — drag-and-drop for blocks and tabs
- **framer-motion** — animations
- **Tailwind CSS** — styling
- **rbush** — R-tree spatial index for collision detection

## Dev

```bash
pnpm dev      # Vite dev server
pnpm build    # TypeScript check + Vite build
pnpm preview  # Preview production build
pnpm lint     # ESLint + TypeScript check
```

## License

MIT © Kostiantyn Keilin