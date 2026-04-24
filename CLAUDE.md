# SlotPaste — CLAUDE.md

> **При каждой инициации работы**: прочитай `.claude/instructions.md` и следуй правилам оттуда на протяжении всей сессии.

## Project overview

**SlotPaste** — web-приложение (React + TypeScript + Vite), clipboard manager заточенный под job search workflow: храним текстовые блоки (cover letter snippets, ссылки, skills), копируем по клику, организуем по табам.

## Tech stack

- **React 18** + **TypeScript**
- **Vite** (bundler)
- **localStorage** — персистентное хранение состояния
- **@dnd-kit/core + @dnd-kit/sortable** — drag-and-drop блоков и табов
- **framer-motion** — анимации (toast, modal, блоки)
- **Tailwind CSS** — утилити-классы для стилей

## Project structure

```
slotpaste/
├── src/
│   ├── App.tsx          # root, layout
│   ├── main.tsx         # entry point
│   ├── components/
│   │   ├── TabBar/          # табы + DnD сортировка (hooks.ts + index.tsx)
│   │   ├── BlockList/       # canvas-режим, pan/zoom, блоки (hooks.ts + index.tsx)
│   │   ├── Block/           # один блок (hooks.ts + index.tsx)
│   │   ├── AddBlock/        # форма добавления блока (hooks.ts + index.tsx)
│   │   ├── DraggableBlock.tsx   # обёртка useDraggable для canvas
│   │   ├── EditPopup.tsx    # попап редактирования (portal)
│   │   ├── ColorSwatches.tsx
│   │   ├── ListView.tsx     # list-режим с DnD reorder
│   │   ├── SettingsPanel.tsx
│   │   └── Toast.tsx
│   ├── hooks/
│   │   ├── useStore.ts    # localStorage persistence (debounced 400ms)
│   │   ├── useClipboard.ts  # navigator.clipboard.writeText
│   │   └── useToast.ts
│   ├── types/
│   │   └── index.ts       # Tab, Block, Appearance, AppState
│   ├── utils/
│   │   ├── collision.ts   # R-tree (rbush) collision detection
│   │   ├── color.ts
│   │   └── nanoid.ts
│   └── constants.ts       # CANVAS_SIZE, LONG_PRESS_MS, BLOCK_DEFAULT_W/H, etc.
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Core data types

```typescript
interface Block {
  id: string;
  text: string;
  fontSize: FontSize;
  color?: string;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
}

interface Tab {
  id: string;
  name: string;
  blocks: Block[];
  viewMode: 'list' | 'canvas';
}

interface Appearance {
  bgColor: string;
  bgOpacity: number;
  blockColor: string;
  blockOpacity: number;
  recentColors: string[];
}

interface AppState {
  tabs: Tab[];
  activeTabId: string;
  appearance: Appearance;
}
```

## Feature roadmap

См. `.claude/roadmap.md`. Обновляй его перед каждым коммитом.

## Design decisions

**Тема по умолчанию**:
- Фон: `#0e0e0e` @ 80% opacity
- Блоки: непрозрачные, `#1a1a1a` с `border: 1px solid rgba(255,255,255,0.08)`
- Акцент (copy success): `#1D9E75` (teal)
- Danger: `#E24B4A`

**Копирование**: `navigator.clipboard.writeText()` — plain text only. Никогда не использовать `ClipboardItem` или HTML/RTF типы.

**Персистентность**: `useStore` сохраняет в localStorage с дебаунсом 400мс — обновления React немедленные, запись на диск батчится.

**Toast**: появляется снизу/сбоку, текст `"${preview}" скопирован`, исчезает через 2.2s.

## Dev commands

```bash
pnpm dev        # Vite dev server
pnpm build      # tsc + vite build
pnpm preview    # preview production build
pnpm lint       # ESLint + TypeScript check
```