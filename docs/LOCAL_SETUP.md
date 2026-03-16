# Local Setup and Running Guide

Detailed guide for running Quiz Generator locally (development mode).

---

## System Requirements

| Tool        | Version | Check              |
| ----------- | ------- | ------------------ |
| **Node.js** | >= 18   | `node --version`   |
| **npm**     | >= 9    | `npm --version`    |
| **Python**  | >= 3.10 | `python --version` |
| **Git**     | any     | `git --version`    |

---

## 1. Clone the Project

```bash
git clone https://github.com/<your-username>/web-quizz.git
cd web-quizz
```

---

## 2. Backend Setup

```bash
cd back-end
```

### 2.1 Create a virtual environment (recommended)

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2.2 Install dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Configure environment

Create a `.env` file in the `back-end/` directory:

```env
# Required if you want to generate quizzes (get a key at https://aistudio.google.com/apikey)
# Or you can add keys via the Settings page in the app
GEMINI_API_KEY=your_api_key_here

# Optional
SECRET_KEY=your-random-secret-key
FLASK_ENV=development
```

> **Gemini API Key:** You can get one for free at [Google AI Studio](https://aistudio.google.com/apikey). Or add a key directly in the app at **Settings > API Keys**.

### 2.4 Run the backend

```bash
python app.py
```

The backend will run at `http://localhost:5000`. Verify by visiting `http://localhost:5000/api/health`.

---

## 3. Frontend Setup

Open a **new terminal**, keep the backend running:

```bash
cd front-end
npm install
```

### 3.1 Run Web (browser only)

```bash
npm run dev:react
```

Open browser at **http://localhost:5123**

### 3.2 Run Desktop (Electron)

```bash
npm run dev
```

This command runs Vite dev server + Electron app in parallel. The desktop window will open automatically.

---

## 4. Build Desktop App

### Build for Windows

```bash
cd front-end
npm run dist:win
```

Output files in `front-end/dist/`:

- `front-end 0.0.0.exe` — Portable (run directly)
- `front-end 0.0.0.msi` — Installer

### Build for macOS

```bash
npm run dist:mac
```

### Build for Linux

```bash
npm run dist:linux
```

### Full build (with packaged backend)

```bash
npm run build:desktop:win
```

This command packages the backend (PyInstaller) + frontend (Electron) into a complete desktop app.

---

## 5. Advanced Configuration

### Change backend port

```bash
# Use the PORT environment variable
PORT=8000 python app.py
```

### Change frontend API URL

```bash
# When the backend runs on a different port
VITE_API_URL=http://localhost:8000 npm run dev:react
```

### CORS

The backend allows these origins by default:

- `http://localhost:5123` (Vite dev)
- `http://localhost:5173`
- `http://localhost:3000`
- `http://localhost:4173` (Vite preview)

To add other origins, set the `CORS_ORIGINS` variable in `.env`:

```env
CORS_ORIGINS=http://localhost:5123,http://localhost:3000,https://your-domain.com
```

---

## 6. API Structure

| Method | Endpoint                 | Description                 |
| ------ | ------------------------ | --------------------------- |
| GET    | `/api/health`            | Health check                |
| GET    | `/api/folders/`          | List folders                |
| POST   | `/api/folders/`          | Create folder               |
| POST   | `/api/quiz/generate`     | Generate quiz from document |
| POST   | `/api/quiz/extract-text` | Extract text                |
| GET    | `/api/quiz/sets`         | List quiz sets              |
| GET    | `/api/stats/overview`    | Statistics overview         |
| POST   | `/api/stats/attempts`    | Save quiz attempt           |
| GET    | `/api/keys/`             | List API keys               |

See API details at [back-end/ARCHITECTURE.md](../back-end/ARCHITECTURE.md).

---

## Troubleshooting

### Backend won't start

```bash
# Check if port 5000 is in use
netstat -ano | findstr ":5000"    # Windows
lsof -i :5000                     # macOS/Linux
```

### CORS error trên trình duyệt

Đảm bảo origin của frontend nằm trong `CORS_ORIGINS` config. Xem mục [CORS](#cors) ở trên.

### Electron disk_cache warnings

Các lỗi `disk_cache` / `gpu_disk_cache` khi chạy Electron là warnings bình thường của Chromium, không ảnh hưởng hoạt động app.
