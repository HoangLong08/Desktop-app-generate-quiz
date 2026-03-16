# Front-end Architecture — Web Quiz

The front-end is a **React 19** + **TypeScript** application, built with **Vite 7**, styled with **Tailwind CSS v4** + **shadcn/ui**, and supports desktop mode via **Electron 40**.

---

## 1. Overview

- **Entry point:** `index.html` → `src/ui/main.tsx`
- **Framework:** React 19 + TypeScript (ES2022, ESNext module)
- **Routing:** `react-router-dom` v7 (`HashRouter` — compatible with Electron `file://`)
- **State & Data fetching:** TanStack React Query (query cache, mutations)
- **Styling:** Tailwind CSS v4 (Vite plugin) + shadcn/ui (Radix UI primitives)
- **API:** Native `fetch` calling backend at `http://localhost:5000`
- **Desktop:** Electron 40 (portable + msi)

---

## 2. Directory Structure

```
front-end/
├── index.html                 # HTML entry, mount #root
├── package.json               # Dependencies & scripts
├── vite.config.ts             # Vite: React plugin, Tailwind plugin, alias @→src
├── tsconfig.json              # TS config, path alias @/*→./src/*
├── tsconfig.app.json          # TS config for app (strict mode)
├── tsconfig.node.json         # TS config for Node (Vite, Electron build)
├── electron-builder.json      # Electron Builder config
├── eslint.config.js           # ESLint flat config
├── types.d.ts                 # Electron IPC types
├── ARCHITECTURE.md            # This file
│
├── src/
│   ├── main.tsx               # Re-export (actual entry is src/ui/main.tsx)
│   ├── vite-env.d.ts          # Vite env types (VITE_API_URL)
│   │
│   ├── config/                # App config & providers
│   │   ├── app.ts             # APP_CONFIG: API_URL (default localhost:5000)
│   │   ├── app-provider.tsx   # QueryClientProvider + React Query Devtools
│   │   └── index.ts           # Re-exports
│   │
│   ├── lib/                   # Shared utilities
│   │   ├── utils.ts           # cn() — clsx + tailwind-merge
│   │   └── export.ts          # exportQuizToDocx() — export quiz to DOCX file
│   │
│   ├── components/ui/         # shadcn/ui primitives (Radix-based)
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sonner.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   └── tooltip.tsx
│   │
│   ├── features/              # Feature modules (api, hooks, types)
│   │   ├── api-keys/          # Gemini API key management
│   │   ├── folders/           # Folder CRUD
│   │   ├── quizz/             # Quiz generation, quiz sets, questions
│   │   ├── stats/             # Quiz attempt statistics
│   │   └── upload/            # Upload file history
│   │
│   ├── ui/                    # Main UI
│   │   ├── main.tsx           # ReactDOM.createRoot, StrictMode, providers, router
│   │   ├── App.tsx            # Layout + Routes
│   │   ├── index.css          # Tailwind imports, theme variables, dark mode
│   │   ├── Chart.tsx          # Recharts wrapper components
│   │   ├── BaseChart.tsx      # Base chart config
│   │   ├── useStatistics.ts   # Statistics hook (Electron IPC)
│   │   ├── components/        # Shared UI components
│   │   └── pages/             # Main pages
│   │
│   ├── electron/              # Electron main process
│   │   ├── main.ts            # Main process entry
│   │   ├── backendManager.ts  # Flask backend process management
│   │   ├── pathResolver.ts    # Resource path resolution
│   │   ├── preload.cts        # Preload script (contextBridge)
│   │   ├── resourceManager.ts # Resource handling
│   │   ├── tray.ts            # System tray icon
│   │   ├── util.ts            # Electron utilities
│   │   └── tsconfig.json      # Separate TS config for Electron
│   │
│   └── assets/
│       └── react.svg
```

---

## 3. Routing (`App.tsx`)

| Path          | Component          | Description                                                      |
| ------------- | ------------------ | ---------------------------------------------------------------- |
| `/`           | `HomePage`         | Folder list, create/edit/delete folders                          |
| `/folder/:id` | `FolderDetailPage` | Folder details: create quiz, history, uploaded files, statistics |
| `/quiz`       | `QuizPage`         | Quiz interface (receives state from navigate)                    |
| `/stats`      | `StatsPage`        | Aggregated statistics, heatmap, timeline                         |
| `/settings`   | `SettingsPage`     | Gemini API key management, token usage, model info               |

**Layout:** `Header` (top) + page content + `Toaster` (sonner notifications). Dark mode by default (`className="dark"`).

---

## 4. Feature Modules (`src/features/`)

Each feature follows a standard structure:

```
feature-name/
├── types.ts    # TypeScript interfaces
├── api.ts      # Fetch functions (calling backend REST API)
├── hooks.ts    # React hooks (TanStack Query useQuery/useMutation or useState)
└── index.ts    # Re-exports
```

### 4.1 `api-keys` — Gemini API Key Management

| File       | Contents                                                                            |
| ---------- | ----------------------------------------------------------------------------------- |
| `types.ts` | `GeminiApiKey`, `KeyPoolSummary`, `ModelSummary`, `ModelUsageStats`, `KeysResponse` |
| `api.ts`   | `getKeysApi`, `addKeyApi`, `updateKeyApi`, `deleteKeyApi` → `/api/keys/`            |
| `hooks.ts` | `useApiKeys()` — CRUD keys, refresh, pool summary                                   |

### 4.2 `folders` — Folders / Collections

| File       | Contents                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------ |
| `types.ts` | `Folder`                                                                                   |
| `api.ts`   | `getFoldersApi`, `createFolderApi`, `updateFolderApi`, `deleteFolderApi` → `/api/folders/` |
| `hooks.ts` | `useFolders()` — TanStack Query for folder CRUD                                            |

### 4.3 `quizz` — Quiz Generation & Taking

| File       | Contents                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts` | `QuizConfig`, `QuizQuestion`, `QuizOption`, `QuizSetSummary`, `QuizSetDetail`, `InputMode`, `YouTubeInput`, `UploadedFile`, `TokenUsage` |
| `api.ts`   | `generateQuizApi`, `getQuizSetsApi`, `getQuizSetApi`, `deleteQuizSetApi`, `extractTextApi` → `/api/quiz/`                                |
| `hooks.ts` | `useGenerateQuiz()`, `useQuizSets()`, `useDeleteQuizSet()` — TanStack mutations/queries                                                  |

### 4.4 `stats` — Quiz Attempt Statistics

| File       | Contents                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts` | `QuizAttempt`, `StatsOverview`, `HeatmapEntry`, `TimelineEntry`, `FolderDetailStats`                                               |
| `api.ts`   | `saveAttemptApi`, `getAttemptsApi`, `getHeatmapApi`, `getTimelineApi`, `getOverviewApi`, `getFolderDetailStatsApi` → `/api/stats/` |
| `hooks.ts` | `useSaveAttempt()`, `useStatsOverview()`, `useHeatmap()`, `useTimeline()`, `useFolderDetailStats()`                                |

### 4.5 `upload` — Upload History

| File       | Contents                                                                                |
| ---------- | --------------------------------------------------------------------------------------- |
| `types.ts` | `UploadedFile`, `InputMode`, `YouTubeInput`, `UploadRecord`                             |
| `api.ts`   | `getUploadRecordsApi`, `deleteUploadRecordApi`, `getUploadContentApi` → `/api/uploads/` |
| `hooks.ts` | `useUploadRecords()`, `useDeleteUploadRecord()` — TanStack Query                        |

---

## 5. UI Components (`src/ui/components/`)

| Component                | Description                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `Header.tsx`             | App-wide header: logo, nav links (Stats, API Keys)                                                   |
| `InputSourceTabs.tsx`    | Input source tabs: **Files** / **YouTube** / **Text**. Each tab shows previously used source history |
| `FileUpload.tsx`         | Drag & drop file upload (PDF, DOCX, images)                                                          |
| `QuizConfig.tsx`         | Quiz configuration panel: question count, question type, difficulty, language, time limit            |
| `QuizQuestion.tsx`       | Display and interact with a question (multiple choice, true/false, fill-in-the-blank)                |
| `UploadHistory.tsx`      | List of uploaded files/YouTube/text in a folder                                                      |
| `FolderStatsSection.tsx` | Detailed statistics for a folder (attempts, accuracy)                                                |
| `DocxPreview.tsx`        | DOCX file content preview                                                                            |

---

## 6. Pages (`src/ui/pages/`)

### `HomePage.tsx`

Folder list displayed as grid cards. Create/edit/delete folders via dialog. Each card shows name, description, color, and quiz count.

### `FolderDetailPage.tsx`

4 tabs:

- **Create Quiz:** Select source (file/YouTube/text) + quiz configuration + generate button
- **History:** List of created quizzes, restart or delete
- **Uploaded Files:** Upload record history (file, YouTube URL, text preview)
- **Statistics:** Detailed folder stats

### `QuizPage.tsx`

Receives `questions`, `config` from `navigate state`. Displays questions one at a time, countdown timer, scoring, shows results + explanations. Supports exporting quiz to DOCX.

### `StatsPage.tsx`

Statistics overview: overview cards, accuracy heatmap by folder, timeline chart, recent attempts list.

### `SettingsPage.tsx`

Gemini API key management:

- Summary cards (total keys, active, tokens, requests)
- Token usage breakdown (input/output bar)
- Token table by model (requests, tokens, limits RPD/RPM/TPM)
- Key cards list (toggle, rename, delete, per-key model stats)
- Free Tier limits reference (2.5 Flash, 2.5 Flash Lite, 2.0 Flash)

---

## 7. Shared UI Primitives (`src/components/ui/`)

Uses **shadcn/ui** — components based on Radix UI, styled with Tailwind CSS:

`Badge`, `Button`, `Card`, `Dialog`, `Input`, `Label`, `Progress`, `RadioGroup`, `ScrollArea`, `Select`, `Separator`, `Sonner` (toast), `Switch`, `Tabs`, `Textarea`, `Tooltip`

---

## 8. Styling

- **Tailwind CSS v4:** imported directly via Vite plugin (`@tailwindcss/vite`), no `tailwind.config.js` needed
- **Theme:** CSS variables in `src/ui/index.css` — `:root` (light) and `.dark` (dark mode)
- **Animations:** `tw-animate-css`
- **Utility:** `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge)

---

## 9. Config & Bootstrap

### `src/config/app.ts`

```typescript
export const APP_CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:5000",
};
```

### `src/config/app-provider.tsx`

Wraps the app in `QueryClientProvider` (TanStack React Query) + DevTools.

### `src/ui/main.tsx`

```
StrictMode → AppProvider (QueryClient) → HashRouter → App
```

---

## 10. Electron (Desktop)

| File                 | Description                                                         |
| -------------------- | ------------------------------------------------------------------- |
| `main.ts`            | Main process: creates BrowserWindow, loads dist-react or dev server |
| `backendManager.ts`  | Flask backend process management (spawn/kill)                       |
| `pathResolver.ts`    | Path resolution for dev/production                                  |
| `preload.cts`        | contextBridge: expose API to renderer                               |
| `resourceManager.ts` | Resource management (icons, assets)                                 |
| `tray.ts`            | System tray icon + menu                                             |
| `util.ts`            | General utilities                                                   |

**Build:** `electron-builder.json` — appId `com.n-ziermann.front-end`, output portable + msi (Windows).

---

## 11. Scripts

| Script              | Description                                     |
| ------------------- | ----------------------------------------------- |
| `dev`               | Run Vite dev server + Electron in parallel      |
| `dev:react`         | Vite dev server only (port 5123)                |
| `build`             | TypeScript compile + Vite build → `dist-react/` |
| `lint`              | ESLint                                          |
| `preview`           | Vite preview build                              |
| `dist:win`          | Build Electron for Windows (x64)                |
| `dist:mac`          | Build Electron for macOS (ARM64)                |
| `dist:linux`        | Build Electron for Linux (x64)                  |
| `build:desktop:win` | Build backend + Electron Windows                |

---

## 12. Main Dependencies

- **UI:** react, react-dom, react-router-dom, lucide-react
- **Components:** @radix-ui/\*, class-variance-authority, clsx, tailwind-merge
- **Styling:** tailwindcss, @tailwindcss/vite, tw-animate-css, shadcn
- **Data:** @tanstack/react-query, @tanstack/react-query-devtools
- **Charts:** recharts
- **Documents:** docx, mammoth, jspdf
- **Notifications:** sonner
- **Desktop:** electron, electron-builder, os-utils

---

This document describes the current front-end structure and flow. When adding a new feature, create a module under `src/features/<feature-name>/` (types, api, hooks, index) and add pages/components in `src/ui/`.
