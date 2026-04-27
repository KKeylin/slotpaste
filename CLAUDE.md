# SlotPaste — CLAUDE.md

> **On every session start**: read `.claude/instructions.md` and `.gitignore`, follow their rules throughout the session.

## Collaboration rules (summary from instructions.md)

- **Respond in Russian** in conversation; all documentation and code comments in **English**
- **One step at a time** — one instruction, wait for confirmation, then next
- **Git is manual** — never run git commands directly; always give the exact command for manual execution
- **No Co-Authored-By** — never add to commit messages
- **No unsolicited changes** — only what the current step requires; no refactoring "while we're here"
- **Update roadmap before each commit** — mark completed items in `.claude/roadmap.md`, sync with `README.md`
- **Settled decisions stay settled** — everything in "Architectural decisions" below is closed
- **Disagree → execute → flag** — execute the instruction first, then post a 🟣-marked disagreement note explaining what and why

## Project overview

**SlotPaste** is a PWA (React + TypeScript + Vite) clipboard manager: store text blocks (snippets, links, templates), copy with one click, organize across tabs. Fully client-side, works offline, installable on desktop.

## Tech stack

- **React 18** + **TypeScript**
- **Vite** (bundler) + **vite-plugin-pwa** (Service Worker, manifest)
- **Tailwind CSS v4** — CSS-first config, no `tailwind.config.js`
- **localStorage** — persistent state storage
- **@dnd-kit/core + @dnd-kit/sortable** — drag-and-drop for blocks and tabs
- **framer-motion** — animations (toast, modal, blocks)
- **rbush** — R-tree for canvas collision detection
- **Web Crypto API** — AES-256-GCM + PBKDF2 (native, no third-party crypto libs)

## Project structure

```
slotpaste/
├── src/
│   ├── App.tsx              # root component: all state, handlers, layout
│   ├── main.tsx             # entry point
│   ├── constants.ts         # numeric/primitive app-wide constants: CANVAS_SIZE, LONG_PRESS_MS, BLOCK_DEFAULT_W/H, EDIT_OVERHANG, VERSION
│   ├── enums.ts             # string-literal map constants: SECURE_INTENT (and future enum-like objects)
│   ├── components/
│   │   ├── TabBar/              # tabs + DnD sort (hooks.ts + index.tsx)
│   │   ├── BlockList/           # canvas mode: pan/zoom/blocks (hooks.ts + index.tsx)
│   │   ├── Block/               # single block (hooks.ts + index.tsx)
│   │   ├── AddBlock/            # add block form (hooks.ts + index.tsx)
│   │   ├── DraggableBlock.tsx   # useDraggable wrapper for canvas
│   │   ├── EditPopup.tsx        # edit popup (portal)
│   │   ├── ColorSwatches.tsx    # color swatches + color wheel
│   │   ├── ListView.tsx         # list mode with DnD reorder
│   │   ├── SettingsPanel.tsx    # settings panel (bottom sheet on mobile)
│   │   ├── Toast.tsx            # toast notification
│   │   ├── OnboardingModal.tsx  # 4-slide onboarding (? button, auto-show on first visit)
│   │   ├── SecureModal.tsx      # Secure Mode modal (unlock/enable/disable/change)
│   │   └── ImportConfirmModal.tsx  # import warning (replace-all confirmation)
│   ├── hooks/
│   │   ├── useStore.ts              # localStorage persistence (debounced 400ms)
│   │   ├── useSecureMode.ts         # Secure Mode low-level: unlock/lock/encrypt/decrypt/mask
│   │   ├── useSecureOperations.ts   # Secure Mode orchestration: all intents, import flow, state
│   │   ├── useClipboard.ts          # navigator.clipboard.writeText
│   │   └── useToast.ts              # toast state
│   ├── types/
│   │   └── index.ts          # FontSize, Block, Tab, Appearance, SecureConfig, AppState
│   ├── utils/
│   │   ├── crypto.ts         # AES-256-GCM, PBKDF2: deriveKey, encrypt/decryptText, verifyKey, maskText
│   │   ├── collision.ts      # R-tree (rbush) collision detection + aggregate MTV
│   │   ├── color.ts          # isColorDark and color utilities
│   │   └── nanoid.ts         # id generation
└── ...
```

**Folder-component convention**: `index.tsx` (UI + JSX) + `hooks.ts` (logic, state, handlers). Single-file components use one `.tsx` file.

## Core data types

```typescript
export type FontSize = 'h1' | 'h2' | 'md' | 'sm'

export interface Block {
  id: string
  text: string          // in Secure Mode: base64 ciphertext
  fontSize: FontSize
  color?: string
  width?: number
  height?: number
  position?: { x: number; y: number }  // canvas mode only
  groupId?: string      // reserved, not implemented
}

export interface Tab {
  id: string
  name: string
  blocks: Block[]
  viewMode: 'list' | 'canvas'
}

export interface Appearance {
  bgColor: string       // background color, default '#0e0e0e'
  blockColor: string    // block background color, default '#1a1a1a'
  blockOpacity: number  // block opacity 0..1, default 1
  accentColor: string   // accent color (borders, icons), default '#333333'
  recentColors: string[]
}

export interface SecureConfig {
  enabled: boolean
  salt: string          // hex, PBKDF2 salt
  verifyToken: string   // encrypted sentinel for password verification
}

export interface AppState {
  tabs: Tab[]
  activeTabId: string
  appearance: Appearance
  secure?: SecureConfig
}
```

## localStorage keys

- `slotpaste_state` — JSON `AppState`, written debounced at 400ms
- `slotpaste_onboarded` — `'1'` once the onboarding modal has been shown

## Architectural decisions (do not revisit)

- **Plain text clipboard only** — `navigator.clipboard.writeText()`, never `ClipboardItem`, HTML, or RTF types
- **No backend, no accounts** — everything in localStorage; app is fully client-side
- **AES-256-GCM + PBKDF2** for Secure Mode — native Web Crypto API, no third-party crypto libraries
- **Electron dropped** — pure web PWA; Tray/frameless/autostart are not applicable
- **Tailwind v4** — CSS-first, no `tailwind.config.js`; configure via `@theme` in CSS or the Vite plugin
- **groupId on Block** — reserved, not implemented, do not remove

## Secure Mode (architecture)

- Key derived via `deriveKey(password, salt)` → `CryptoKey` (PBKDF2 → AES-256-GCM)
- `verifyToken` is an encrypted sentinel: on unlock, decrypt and compare to verify the password
- `block.text` stores **base64 ciphertext** when Secure Mode is enabled
- `useSecureMode` holds `CryptoKey` in `keyRef` (not in React state); `decryptedTexts: Record<blockId, plaintext>` is in state
- `getDisplayText(blockId, storedText)` — returns plaintext if unlocked, otherwise `maskText(blockId)`
- **Auto-lock**: `beforeunload` → `keyRef.current = null` (key does not survive tab reload or close)
- `SecureModalIntent` in App.tsx — union: `'unlock' | 'enable' | 'disable' | 'change-verify' | 'change-set' | 'import-verify' | null`

## Design decisions

**Default theme:**
- Background: `#0e0e0e`
- Blocks: `#1a1a1a`, `blockOpacity: 1`, `border: 1px solid rgba(255,255,255,0.08)`
- Accent (active tab border, + icon): `#333333`
- Copy success: `#1D9E75` (teal)
- Danger: `#E24B4A`

**Clipboard:** `navigator.clipboard.writeText()` — plain text only.

**Persistence:** `useStore` — React state updates are immediate; localStorage writes are batched via 400ms debounce.

**Toast:** appears bottom/side, text `"${preview}" copied`, disappears after 2.2s.

**Canvas:** `CANVAS_SIZE = 10000×10000`, pan with mouse/touch, zoom with scroll wheel. New blocks appear below the last added. Collision detection via R-tree (`rbush`) + aggregate MTV.

## Feature roadmap

See `.claude/roadmap.md`. Update it before every commit.

## Dev commands

```bash
pnpm dev        # Vite dev server
pnpm build      # tsc + vite build
pnpm preview    # preview production build
pnpm lint       # ESLint + TypeScript check
```