<p align="center">
  <img src="front-end/src/assets/react.svg" alt="Quiz Generator Logo" width="80" />
</p>

<h1 align="center">Quiz Generator</h1>

<p align="center">
  <strong>Tạo câu hỏi trắc nghiệm tự động từ tài liệu bằng AI</strong>
</p>

<p align="center">
  Upload PDF, DOCX, ảnh, dán link YouTube hoặc nhập văn bản — AI sẽ tạo bộ đề trắc nghiệm chất lượng trong vài giây.
</p>

<p align="center">
  <a href="#-tính-năng">Tính năng</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-cài-đặt">Cài đặt</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-đóng-góp">Đóng góp</a>
</p>

---

## ✨ Tính năng

| Tính năng                | Mô tả                                                                   |
| ------------------------ | ----------------------------------------------------------------------- |
| 📄 **Đa nguồn đầu vào**  | PDF, DOCX, ảnh (OCR), YouTube transcript, hoặc văn bản thuần            |
| 🤖 **AI-powered**        | Sử dụng Google Gemini để tạo câu hỏi thông minh, có giải thích          |
| 📝 **Đa dạng câu hỏi**   | Trắc nghiệm, đúng/sai, điền trống — tùy chọn số lượng, độ khó, ngôn ngữ |
| 📁 **Quản lý thư mục**   | Tổ chức quiz theo bộ sưu tập, đánh dấu yêu thích                        |
| 📊 **Thống kê chi tiết** | Heatmap accuracy, timeline tiến bộ, lịch sử làm bài                     |
| 📤 **Xuất DOCX**         | Export bộ đề ra file Word để in hoặc chia sẻ                            |
| 🖥️ **Desktop & Web**     | Chạy như app desktop (Electron) hoặc trên trình duyệt web               |
| 🌙 **Dark mode**         | Giao diện tối mặc định, hỗ trợ chuyển đổi sáng/tối                      |

## 🖼️ Demo

<!-- Thêm screenshot hoặc GIF demo ở đây -->
<!-- ![Demo](docs/screenshots/demo.gif) -->

## 📥 Cài đặt

### Tải app Desktop

Tải file cài đặt cho hệ điều hành của bạn từ [Releases](../../releases/latest):

| Hệ điều hành | File                                      |
| ------------ | ----------------------------------------- |
| **Windows**  | `.exe` (portable) hoặc `.msi` (installer) |
| **macOS**    | `.dmg`                                    |
| **Linux**    | `.AppImage`                               |

### Chạy trên Web (local)

> Xem hướng dẫn chi tiết tại **[docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)**

**Nhanh:**

```bash
# 1. Clone repo
git clone https://github.com/<your-username>/web-quizz.git
cd web-quizz

# 2. Chạy backend
cd back-end
pip install -r requirements.txt
python app.py

# 3. Chạy frontend (terminal mới)
cd front-end
npm install
npm run dev:react
```

Mở trình duyệt tại `http://localhost:5123`

## 🏗️ Tech Stack

### Frontend

- **React 19** + TypeScript
- **Vite 7** — build tool
- **Tailwind CSS v4** + **shadcn/ui** — styling
- **TanStack React Query** — data fetching & cache
- **Electron 40** — desktop app
- **Recharts** — biểu đồ thống kê
- **Framer Motion** — animations

### Backend

- **Flask** (Python) — REST API
- **SQLAlchemy** + SQLite — database
- **Google Gemini** — AI tạo câu hỏi + OCR ảnh (Vision API)
- **pdfplumber** / **PyMuPDF** — xử lý PDF
- **youtube-transcript-api** — lấy transcript YouTube

## 📁 Cấu trúc dự án

```
web-quizz/
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
    └── LOCAL_SETUP.md  # Hướng dẫn cài đặt local
```

## 🔧 Scripts chính

### Frontend (`front-end/`)

| Script               | Mô tả                                |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Chạy dev (Vite + Electron song song) |
| `npm run dev:react`  | Chỉ Vite dev server (web)            |
| `npm run build`      | Build React production               |
| `npm run dist:win`   | Đóng gói Electron cho Windows        |
| `npm run dist:mac`   | Đóng gói Electron cho macOS          |
| `npm run dist:linux` | Đóng gói Electron cho Linux          |

### Backend (`back-end/`)

```bash
python app.py              # Chạy server (port 5000)
```

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy:

1. Fork repo
2. Tạo branch mới (`git checkout -b feature/ten-tinh-nang`)
3. Commit thay đổi (`git commit -m "Add: mô tả"`)
4. Push lên branch (`git push origin feature/ten-tinh-nang`)
5. Tạo Pull Request

## 📄 License

MIT License — xem file [LICENSE](LICENSE) để biết thêm chi tiết.
