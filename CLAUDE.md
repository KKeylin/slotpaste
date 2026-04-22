# SlotPaste — CLAUDE.md

> **При каждой инициации работы**: прочитай `.claude/instructions.md` и следуй правилам оттуда на протяжении всей сессии.

## Project overview

**SlotPaste** — десктопный clipboard manager для macOS (Electron + React + TypeScript),
заточенный под job search workflow: храним текстовые блоки (cover letter snippets,
ссылки, skills), копируем по клику, организуем по табам.

## Tech stack

- **Electron** (main process, IPC, tray, global shortcut)
- **React 18** + **TypeScript**
- **Vite** (renderer bundler, electron-vite)
- **electron-store** — персистентное хранение данных (JSON на диске)
- **@dnd-kit/core + @dnd-kit/sortable** — drag-and-drop блоков и табов
- **framer-motion** — анимации (toast, modal, блоки)
- **Tailwind CSS** — утилити-классы для стилей
- CSS custom properties для кастомизации цвета/прозрачности

Сборка в `.dmg`: `electron-builder` с таргетом `mac`.

## Project structure

```
slotpaste/
├── electron/
│   ├── main.ts          # main process: окно, tray, global shortcut, IPC
│   ├── preload.ts       # contextBridge: expose store API в renderer
│   └── store.ts         # electron-store schema + typed get/set
├── src/
│   ├── App.tsx          # root, провайдеры, layout
│   ├── main.tsx         # renderer entry
│   ├── components/
│   │   ├── TabBar.tsx           # табы + DnD сортировка табов
│   │   ├── Tab.tsx              # один таб
│   │   ├── BlockList.tsx        # список блоков + DnD
│   │   ├── Block.tsx            # один блок (copy, edit, delete)
│   │   ├── FreeCanvas.tsx       # свободное поле с DnD-позиционированием блоков
│   │   ├── AddBlock.tsx         # форма добавления нового блока
│   │   ├── Toast.tsx            # уведомление о копировании
│   │   ├── EditModal.tsx        # модалка редактирования
│   │   └── AppearancePanel.tsx  # настройки цвета/прозрачности фона и блоков
│   ├── hooks/
│   │   ├── useStore.ts    # обёртка над electron-store через IPC
│   │   ├── useClipboard.ts
│   │   └── useToast.ts
│   ├── types/
│   │   └── index.ts       # Tab, Block, Appearance, Position
│   └── styles/
│       ├── globals.css    # CSS vars для темы
│       └── tokens.css     # цвета, радиусы, шрифты
├── electron-builder.yml
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Core data types

```typescript
interface Block {
  id: string;
  text: string;
  color?: string;       // hex, опционально переопределяет тему
  position?: {          // для free canvas режима
    x: number;
    y: number;
  };
  groupId?: string;     // группировка на канвасе
}

interface Tab {
  id: string;
  name: string;
  blocks: Block[];
  viewMode: 'list' | 'canvas';  // список или свободное поле
}

interface Appearance {
  bgColor: string;          // hex
  bgOpacity: number;        // 0–1
  blockColor: string;       // hex
  blockOpacity: number;     // 0–1 (блоки непрозрачные по умолчанию = 1)
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

**Шрифт**: JetBrains Mono / монопространственный — ощущение dev-tool, не SaaS.

**Тема по умолчанию**:
- Фон: `#0e0e0e` @ 80% opacity (полупрозрачный, чтобы был macOS vibrancy эффект)
- Блоки: непрозрачные, `#1a1a1a` с `border: 1px solid rgba(255,255,255,0.08)`
- Акцент (copy success): `#1D9E75` (teal)
- Danger: `#E24B4A`

**Vibrancy**: в `main.ts` окно создаётся с `vibrancy: 'under-window'` и `backgroundMaterial: 'acrylic'` для нативного blur на macOS. Это работает только когда `backgroundColor` прозрачный.

**Копирование**: клик по всей площади блока копирует. Кнопки edit/delete останавливают propagation.

**Toast**: появляется справа, текст `"${preview}" скопирован`, исчезает через 2.2s.

## IPC channels (main ↔ renderer)

```
store:get       → возвращает всё состояние
store:set       → сохраняет всё состояние
clipboard:write → записывает текст в системный буфер (через main process)
window:hide     → скрывает окно (для глобального shortcut toggle)
```

## Dev commands

```bash
npm run dev        # Vite dev server + Electron
npm run build      # TypeScript build
npm run dist       # electron-builder → .dmg
npm run lint       # ESLint + TypeScript check
```

## Setup (новый проект)

```bash
npm create electron-vite@latest slotpaste -- --template react-ts
cd slotpaste
npm install
npm install electron-store @dnd-kit/core @dnd-kit/sortable framer-motion
npm install -D electron-builder tailwindcss autoprefixer
npx tailwindcss init
```

## Key implementation notes

- `electron-store` работает только в main process → expose через `contextBridge` в preload
- DnD на free canvas: используй `useDraggable` из `@dnd-kit/core`, сохраняй `{x, y}` в block.position
- Группировка на канвасе: при release с overlap > 50% предлагать создать группу (визуально — рамка вокруг группы блоков)
- Vibrancy + прозрачность окна: `win.setBackgroundColor('#00000000')` в main.ts
- Для macOS frameless: `titleBarStyle: 'hiddenInset'` сохраняет нативные traffic lights
- electron-builder таргет: `{ target: 'dmg', arch: ['arm64', 'x64'] }` для universal binary
- Clipboard always writes plain text only — `navigator.clipboard.writeText()` strips formatting by design. Never use `ClipboardItem` or write HTML/RTF types. If Electron IPC clipboard is added later (`clipboard.writeText()` in main process), same rule applies — text only, no `writeHTML()`. This is a core feature, not a bug.
