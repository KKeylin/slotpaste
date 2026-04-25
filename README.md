# SlotPaste

Store any text you reuse — copy it back in one tap. Fast, organized, and secure.

---

## Why

Some text you type over and over. SlotPaste keeps those snippets one click away, organized in tabs the way you think, with optional end-to-end encryption for anything sensitive.

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

**Data**
- Export all data to JSON (includes encrypted content as-is if Secure Mode is on)
- Import JSON with replace confirmation; password-protected files prompt for verification

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