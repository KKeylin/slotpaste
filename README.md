# SlotPaste

**The clipboard manager that lives in your browser.**  
Store the text you reuse every day — paste it back in one click.

> Email templates, code snippets, boilerplate, links you share constantly — stop hunting through notes and history.

---

<!-- screenshot or gif goes here -->
<!-- ![SlotPaste demo](docs/demo.gif) -->

---

## What it does

- **One click to copy** — tap any block to put its text in your clipboard instantly
- **Tabs for context** — separate canvases for work, personal, code, or whatever you need
- **Free canvas mode** — arrange blocks visually: drag, zoom, pin them anywhere
- **Search across all tabs** — find any snippet in milliseconds
- **Secure Mode** — AES-256-GCM encryption for anything sensitive; auto-locks on tab close
- **Works offline** — installable PWA, no account, no backend, no tracking

---

## Install

Open **[slotpaste.app](https://slotpaste.app)** in Chrome or Safari and install it to your dock from the browser menu.

Works on desktop and mobile.

---

## Key features

**Blocks**  
Add, copy, edit, resize, color-code. Long-press to enter wiggle mode and delete.

**Canvas mode**  
10 000 × 10 000 free canvas — drag blocks anywhere, pan, zoom with scroll wheel. Collision detection keeps blocks from overlapping.

**List mode**  
Compact scrollable list with drag-to-reorder — good for large collections.

**Secure Mode**  
Native Web Crypto API (AES-256-GCM + PBKDF2). Your key never leaves the device. Configurable lock shortcut, read-only when locked.

**Keyboard shortcuts** (all configurable in Settings)

| Shortcut | Action |
|---|---|
| `Alt+N` | Focus add-block input |
| `Alt+F` | Focus search |
| `Alt+←` / `Alt+→` | Previous / next tab |
| `Alt+1–9` | Switch to tab by number |
| `Alt+L` | Lock / unlock |

**Data portability**  
Export / import as JSON. Encrypted exports stay encrypted — password is verified on import. Reset with backup download.

---

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS v4 · @dnd-kit · framer-motion · rbush · Web Crypto API · vite-plugin-pwa

---

## Dev

```bash
pnpm dev      # Vite dev server
pnpm build    # TypeScript check + Vite build
pnpm preview  # Preview production build
pnpm lint     # ESLint + TypeScript check
```

---

## License

MIT © Kostiantyn Keilin