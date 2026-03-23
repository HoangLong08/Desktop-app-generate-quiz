<p align="center">
  <img src="front-end/src/assets/react.svg" alt="Quiz Generator Logo" width="80" />
</p>

<h1 align="center">Quiz Generator</h1>

<p align="center">
  <strong>Automatically generate quiz questions from documents using AI</strong>
</p>

<p align="center">
  Upload PDF, DOCX, images, paste a YouTube link, or enter text — AI will generate high-quality quiz questions in seconds.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-installation">Installation</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## ✨ Features

| Feature                       | Description                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| 📄 **Multiple input sources** | PDF, DOCX, images (OCR), YouTube transcript, or plain text                                |
| 🤖 **AI-powered**             | Uses Google Gemini to generate smart questions with explanations                          |
| 📝 **Diverse question types** | Multiple choice, true/false, fill-in-the-blank — configurable count, difficulty, language |
| 📁 **Folder management**      | Organize quizzes into collections                                                         |
| 📊 **Detailed statistics**    | Accuracy heatmap, progress timeline, attempt history                                      |
| 📤 **Export options**         | Export quizzes to DOCX for printing or Kahoot! for interactive playing                    |
| 🖥️ **Desktop & Web**          | Run as a desktop app (Electron) or in the browser                                         |
| 🌙 **Dark mode**              | Dark theme by default, with light/dark toggle support                                     |

## 🖼️ Demo

<!-- Add screenshots or GIF demo here -->
<!-- ![Demo](docs/screenshots/demo.gif) -->

## 📥 Installation

### 🎁 Download Portable Release (Recommended)

The easiest way to use the application is to download the pre-packaged release. You do not need to install Python or Node.js.

1. Go to the [Releases](https://github.com/HoangLong08/Desktop-app-generate-quiz/releases/latest) page.
2. Download the latest `.zip` release asset for your operating system.
3. **Extract** the `.zip` file to a folder on your computer.
4. Open the extracted folder and run the application executable.

### Run on Web (local)

> See detailed instructions at **[docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)**

**Quick start:**

```bash
# 1. Clone repo
git clone https://github.com/HoangLong08/Desktop-app-generate-quiz.git
cd Desktop-app-generate-quiz

# 2. Run backend
cd back-end
pip install -r requirements.txt
python app.py

# 3. Run frontend (new terminal)
cd front-end
yarn install
yarn dev
```

Open browser at `http://localhost:5123`

## 🏗️ Tech Stack

### Frontend

- **React 19** + TypeScript
- **Vite 7** — build tool
- **Tailwind CSS v4** + **shadcn/ui** — styling
- **TanStack React Query** — data fetching & cache
- **Electron 40** — desktop app
- **Recharts** — statistics charts
- **Framer Motion** — animations

### Backend

- **Flask** (Python) — REST API
- **SQLAlchemy** + SQLite — database
- **Google Gemini** — AI question generation + image OCR (Vision API)
- **pdfplumber** / **PyMuPDF** — PDF processing
- **youtube-transcript-api** — YouTube transcript extraction

## 📁 Project Structure

```text
Desktop-app-generate-quiz/
├── front-end/          # React + Electron app
│   ├── src/
│   │   ├── ui/         # Pages, components, styling
│   │   ├── features/   # Feature modules (api, hooks, types)
│   │   ├── electron/   # Electron main process
│   │   └── config/     # App config & providers
│   └── dist/           # Build output
│
├── back-end/           # Flask API server
│   ├── app/
│   │   ├── features/   # folder, quizz, upload, stats, api_keys
│   │   └── db.py       # Database instance
│   ├── config.py       # Configuration
│   └── app.py          # Entry point
│
└── docs/               # Documentation
    └── LOCAL_SETUP.md  # Local setup guide
```

## 🔧 Main Scripts

### Frontend (`front-end/`)

| Script               | Description                           |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Run dev (Vite + Electron in parallel) |
| `npm run dev:react`  | Vite dev server only (web)            |
| `npm run build`      | Build React production                |
| `npm run dist:win`   | Package Electron for Windows          |
| `npm run dist:mac`   | Package Electron for macOS            |
| `npm run dist:linux` | Package Electron for Linux            |

### Backend (`back-end/`)

```bash
python app.py              # Run server (port 5000)
```

## 🤝 Contributing

All contributions are welcome! Please:

1. Fork the repo
2. Create a new branch (`git checkout -b feature/feature-name`)
3. Commit your changes (`git commit -m "Add: description"`)
4. Push to the branch (`git push origin feature/feature-name`)
5. Create a Pull Request

## 📄 License

MIT License — see [LICENSE](LICENSE) for more details.
