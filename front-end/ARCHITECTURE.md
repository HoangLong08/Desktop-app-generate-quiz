# Kiến trúc Front-end — Web Quiz

Front-end là ứng dụng **React 19** + **TypeScript**, build bằng **Vite 7**, styling bằng **Tailwind CSS v4** + **shadcn/ui**, và hỗ trợ chạy desktop qua **Electron 40**.

---

## 1. Tổng quan

- **Entry point:** `index.html` → `src/ui/main.tsx`
- **Framework:** React 19 + TypeScript (ES2022, ESNext module)
- **Routing:** `react-router-dom` v7 (`HashRouter` — tương thích Electron `file://`)
- **State & Data fetching:** TanStack React Query (query cache, mutations)
- **Styling:** Tailwind CSS v4 (Vite plugin) + shadcn/ui (Radix UI primitives)
- **API:** Native `fetch` gọi backend tại `http://localhost:5000`
- **Desktop:** Electron 40 (portable + msi)

---

## 2. Cấu trúc thư mục

```
front-end/
├── index.html                 # HTML entry, mount #root
├── package.json               # Dependencies & scripts
├── vite.config.ts             # Vite: React plugin, Tailwind plugin, alias @→src
├── tsconfig.json              # TS config, path alias @/*→./src/*
├── tsconfig.app.json          # TS config cho app (strict mode)
├── tsconfig.node.json         # TS config cho Node (Vite, Electron build)
├── electron-builder.json      # Electron Builder config
├── eslint.config.js           # ESLint flat config
├── types.d.ts                 # Electron IPC types
├── ARCHITECTURE.md            # File này
│
├── src/
│   ├── main.tsx               # Re-export (thực tế entry là src/ui/main.tsx)
│   ├── vite-env.d.ts          # Vite env types (VITE_API_URL)
│   │
│   ├── config/                # App config & providers
│   │   ├── app.ts             # APP_CONFIG: API_URL (default localhost:5000)
│   │   ├── app-provider.tsx   # QueryClientProvider + React Query Devtools
│   │   └── index.ts           # Re-exports
│   │
│   ├── lib/                   # Utilities dùng chung
│   │   ├── utils.ts           # cn() — clsx + tailwind-merge
│   │   └── export.ts          # exportQuizToDocx() — xuất quiz ra file DOCX
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
│   │   ├── api-keys/          # Quản lý Gemini API keys
│   │   ├── folders/           # CRUD thư mục
│   │   ├── quizz/             # Tạo quiz, quiz sets, câu hỏi
│   │   ├── stats/             # Thống kê làm bài
│   │   └── upload/            # Lịch sử file đã upload
│   │
│   ├── ui/                    # Giao diện chính
│   │   ├── main.tsx           # ReactDOM.createRoot, StrictMode, providers, router
│   │   ├── App.tsx            # Layout + Routes
│   │   ├── index.css          # Tailwind imports, theme variables, dark mode
│   │   ├── Chart.tsx          # Recharts wrapper components
│   │   ├── BaseChart.tsx      # Base chart config
│   │   ├── useStatistics.ts   # Hook thống kê (Electron IPC)
│   │   ├── components/        # UI components dùng chung
│   │   └── pages/             # Các trang chính
│   │
│   ├── electron/              # Electron main process
│   │   ├── main.ts            # Main process entry
│   │   ├── backendManager.ts  # Quản lý Flask backend process
│   │   ├── pathResolver.ts    # Resolve đường dẫn resources
│   │   ├── preload.cts        # Preload script (contextBridge)
│   │   ├── resourceManager.ts # Resource handling
│   │   ├── tray.ts            # System tray icon
│   │   ├── util.ts            # Electron utilities
│   │   └── tsconfig.json      # TS config riêng cho Electron
│   │
│   └── assets/
│       └── react.svg
```

---

## 3. Routing (`App.tsx`)

| Path | Component | Mô tả |
|------|-----------|--------|
| `/` | `HomePage` | Danh sách thư mục, tạo/sửa/xóa folder |
| `/folder/:id` | `FolderDetailPage` | Chi tiết folder: tạo quiz, lịch sử, file đã tải, thống kê |
| `/quiz` | `QuizPage` | Giao diện làm quiz (nhận state từ navigate) |
| `/stats` | `StatsPage` | Thống kê tổng hợp, heatmap, timeline |
| `/settings` | `SettingsPage` | Quản lý Gemini API keys, token usage, model info |

**Layout:** `Header` (top) + page content + `Toaster` (sonner notifications). Mặc định dark mode (`className="dark"`).

---

## 4. Feature Modules (`src/features/`)

Mỗi feature có cấu trúc chuẩn:

```
feature-name/
├── types.ts    # TypeScript interfaces
├── api.ts      # Fetch functions (gọi backend REST API)
├── hooks.ts    # React hooks (TanStack Query useQuery/useMutation hoặc useState)
└── index.ts    # Re-exports
```

### 4.1 `api-keys` — Quản lý Gemini API Keys

| File | Nội dung |
|------|----------|
| `types.ts` | `GeminiApiKey`, `KeyPoolSummary`, `ModelSummary`, `ModelUsageStats`, `KeysResponse` |
| `api.ts` | `getKeysApi`, `addKeyApi`, `updateKeyApi`, `deleteKeyApi` → `/api/keys/` |
| `hooks.ts` | `useApiKeys()` — CRUD keys, refresh, pool summary |

### 4.2 `folders` — Thư mục / Bộ sưu tập

| File | Nội dung |
|------|----------|
| `types.ts` | `Folder` |
| `api.ts` | `getFoldersApi`, `createFolderApi`, `updateFolderApi`, `deleteFolderApi` → `/api/folders/` |
| `hooks.ts` | `useFolders()` — TanStack Query cho CRUD folder |

### 4.3 `quizz` — Tạo và làm Quiz

| File | Nội dung |
|------|----------|
| `types.ts` | `QuizConfig`, `QuizQuestion`, `QuizOption`, `QuizSetSummary`, `QuizSetDetail`, `InputMode`, `YouTubeInput`, `UploadedFile`, `TokenUsage` |
| `api.ts` | `generateQuizApi`, `getQuizSetsApi`, `getQuizSetApi`, `deleteQuizSetApi`, `extractTextApi` → `/api/quiz/` |
| `hooks.ts` | `useGenerateQuiz()`, `useQuizSets()`, `useDeleteQuizSet()` — TanStack mutations/queries |

### 4.4 `stats` — Thống kê làm bài

| File | Nội dung |
|------|----------|
| `types.ts` | `QuizAttempt`, `StatsOverview`, `HeatmapEntry`, `TimelineEntry`, `FolderDetailStats` |
| `api.ts` | `saveAttemptApi`, `getAttemptsApi`, `getHeatmapApi`, `getTimelineApi`, `getOverviewApi`, `getFolderDetailStatsApi` → `/api/stats/` |
| `hooks.ts` | `useSaveAttempt()`, `useStatsOverview()`, `useHeatmap()`, `useTimeline()`, `useFolderDetailStats()` |

### 4.5 `upload` — Lịch sử Upload

| File | Nội dung |
|------|----------|
| `types.ts` | `UploadedFile`, `InputMode`, `YouTubeInput`, `UploadRecord` |
| `api.ts` | `getUploadRecordsApi`, `deleteUploadRecordApi`, `getUploadContentApi` → `/api/uploads/` |
| `hooks.ts` | `useUploadRecords()`, `useDeleteUploadRecord()` — TanStack Query |

---

## 5. UI Components (`src/ui/components/`)

| Component | Mô tả |
|-----------|--------|
| `Header.tsx` | Header toàn app: logo, nav links (Stats, API Keys) |
| `InputSourceTabs.tsx` | Tabs chọn nguồn nội dung: **Tập tin** / **YouTube** / **Văn bản**. Mỗi tab có lịch sử nguồn đã dùng trước |
| `FileUpload.tsx` | Drag & drop upload files (PDF, DOCX, ảnh) |
| `QuizConfig.tsx` | Panel cấu hình quiz: số câu, loại câu hỏi, độ khó, ngôn ngữ, thời gian |
| `QuizQuestion.tsx` | Hiển thị và tương tác một câu hỏi (trắc nghiệm, đúng/sai, điền trống) |
| `UploadHistory.tsx` | Danh sách file/YouTube/text đã upload trong folder |
| `FolderStatsSection.tsx` | Thống kê chi tiết cho một folder (attempts, accuracy) |
| `DocxPreview.tsx` | Preview nội dung file DOCX |

---

## 6. Pages (`src/ui/pages/`)

### `HomePage.tsx`

Danh sách thư mục dạng grid card. Tạo/sửa/xóa folder qua dialog. Mỗi card hiện tên, mô tả, màu, số quiz.

### `FolderDetailPage.tsx`

4 tabs:
- **Tạo Quiz:** Chọn nguồn (file/YouTube/text) + cấu hình quiz + nút generate
- **Lịch sử:** Danh sách quiz đã tạo, bắt đầu lại hoặc xóa
- **File đã tải:** Lịch sử upload records (file, YouTube URL, text preview)
- **Thống kê:** Stats chi tiết folder

### `QuizPage.tsx`

Nhận `questions`, `config` từ `navigate state`. Hiển thị từng câu hỏi, đếm thời gian, chấm điểm, hiện kết quả + giải thích. Hỗ trợ export quiz ra DOCX.

### `StatsPage.tsx`

Tổng quan thống kê: overview cards, heatmap accuracy theo folder, timeline chart, danh sách attempts gần nhất.

### `SettingsPage.tsx`

Quản lý Gemini API keys:
- Summary cards (tổng key, active, tokens, requests)
- Token usage breakdown (input/output bar)
- Bảng token theo model (requests, tokens, limits RPD/RPM/TPM)
- Danh sách key cards (toggle, rename, delete, per-key model stats)
- Giới hạn Free Tier reference (2.5 Flash, 2.5 Flash Lite, 2.0 Flash)

---

## 7. Shared UI Primitives (`src/components/ui/`)

Sử dụng **shadcn/ui** — components dựa trên Radix UI, style bằng Tailwind CSS:

`Badge`, `Button`, `Card`, `Dialog`, `Input`, `Label`, `Progress`, `RadioGroup`, `ScrollArea`, `Select`, `Separator`, `Sonner` (toast), `Switch`, `Tabs`, `Textarea`, `Tooltip`

---

## 8. Styling

- **Tailwind CSS v4:** import trực tiếp qua Vite plugin (`@tailwindcss/vite`), không cần `tailwind.config.js`
- **Theme:** CSS variables trong `src/ui/index.css` — `:root` (light) và `.dark` (dark mode)
- **Animations:** `tw-animate-css`
- **Utility:** `cn()` từ `src/lib/utils.ts` (clsx + tailwind-merge)

---

## 9. Config & Bootstrap

### `src/config/app.ts`

```typescript
export const APP_CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:5000",
};
```

### `src/config/app-provider.tsx`

Wrap app trong `QueryClientProvider` (TanStack React Query) + DevTools.

### `src/ui/main.tsx`

```
StrictMode → AppProvider (QueryClient) → HashRouter → App
```

---

## 10. Electron (Desktop)

| File | Mô tả |
|------|--------|
| `main.ts` | Main process: tạo BrowserWindow, load dist-react hoặc dev server |
| `backendManager.ts` | Quản lý Flask backend process (spawn/kill) |
| `pathResolver.ts` | Resolve đường dẫn theo dev/production |
| `preload.cts` | contextBridge: expose API cho renderer |
| `resourceManager.ts` | Quản lý resources (icons, assets) |
| `tray.ts` | System tray icon + menu |
| `util.ts` | Utilities chung |

**Build:** `electron-builder.json` — appId `com.n-ziermann.front-end`, output portable + msi (Windows).

---

## 11. Scripts

| Script | Mô tả |
|--------|--------|
| `dev` | Chạy Vite dev server + Electron song song |
| `dev:react` | Chỉ Vite dev server (port 5123) |
| `build` | TypeScript compile + Vite build → `dist-react/` |
| `lint` | ESLint |
| `preview` | Vite preview build |
| `dist:win` | Build Electron cho Windows (x64) |
| `dist:mac` | Build Electron cho macOS (ARM64) |
| `dist:linux` | Build Electron cho Linux (x64) |
| `build:desktop:win` | Build backend + Electron Windows |

---

## 12. Dependencies chính

- **UI:** react, react-dom, react-router-dom, lucide-react
- **Components:** @radix-ui/*, class-variance-authority, clsx, tailwind-merge
- **Styling:** tailwindcss, @tailwindcss/vite, tw-animate-css, shadcn
- **Data:** @tanstack/react-query, @tanstack/react-query-devtools
- **Charts:** recharts
- **Documents:** docx, mammoth, jspdf
- **Notifications:** sonner
- **Desktop:** electron, electron-builder, os-utils

---

Tài liệu này mô tả đúng cấu trúc và luồng của front-end hiện tại. Khi thêm feature mới, nên tạo module dưới `src/features/<tên-feature>/` (types, api, hooks, index) và thêm page/component trong `src/ui/`.
