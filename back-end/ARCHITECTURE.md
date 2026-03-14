# Kiến trúc Back-end — Web Quiz

Back-end là ứng dụng **Flask** (Python), dùng **SQLAlchemy** với SQLite, tổ chức theo **feature-based** (mỗi tính năng là một module: routes, models, services).

---

## 1. Tổng quan

- **Entry point:** `app.py` → gọi `create_app()` từ `app/__init__.py`
- **Cấu hình:** `config.py` (development/production, env từ `.env`)
- **Database:** Flask-SQLAlchemy, SQLite tại `instance/web_quizz.db` (hoặc theo `USER_DATA_PATH` khi chạy desktop/Electron)
- **API prefix:** `/api/` — các blueprint đăng ký theo từng feature

---

## 2. Cấu trúc thư mục

```
back-end/
├── app.py                 # Entry point, khởi chạy Flask
├── config.py              # Config (SECRET_KEY, DB, upload, Gemini, OCR, CORS)
├── requirements.txt       # Dependencies
├── ARCHITECTURE.md        # File này
│
├── app/
│   ├── __init__.py        # create_app(), đăng ký blueprints, CORS, migrate folders.json
│   ├── db.py              # SQLAlchemy instance (db)
│   ├── data/
│   │   └── folders.json   # Dữ liệu folder cũ (migrate một lần vào SQLite nếu DB trống)
│   │
│   └── features/          # Các feature theo module
│       ├── __init__.py
│       ├── folder/        # Thư mục / bộ sưu tập quiz
│       │   ├── models.py
│       │   ├── folder_service.py
│       │   └── routes.py
│       ├── quizz/         # Tạo quiz, trích văn bản, CRUD quiz sets
│       │   ├── models.py
│       │   ├── routes.py
│       │   ├── quiz_generator.py   # LLM (Gemini) tạo câu hỏi
│       │   ├── ocr_service.py      # PaddleOCR cho ảnh
│       │   ├── pdf_service.py      # PDF → text / OCR
│       │   ├── docx_service.py     # DOCX → text
│       │   ├── youtube_service.py  # YouTube transcript
│       │   ├── text_processing.py  # Chunk, clean, chọn đoạn quan trọng
│       │   └── debug/              # Prompt/response debug (theo chunk)
│       ├── upload/        # Quản lý bản ghi file đã upload
│       │   ├── models.py
│       │   └── routes.py
│       └── stats/         # Thống kê làm bài (attempts, heatmap, timeline)
│           ├── models.py
│           └── routes.py
│
├── instance/
│   └── web_quizz.db       # SQLite DB (tạo tự động)
├── uploads/               # Thư mục lưu file upload (config trong config.py)
└── packages/              # Virtual env / dependencies (nếu dùng venv local)
```

---

## 3. Cấu hình (`config.py`)

| Mục | Mô tả |
|-----|--------|
| **SECRET_KEY** | Từ env, mặc định `dev-secret-key` |
| **SQLALCHEMY_DATABASE_URI** | SQLite: `instance/web_quizz.db` (hoặc theo `USER_DATA_PATH`) |
| **UPLOAD_FOLDER** | Thư mục lưu file upload, max 50MB |
| **ALLOWED_EXTENSIONS** | pdf, png, jpg, jpeg, bmp, webp, tiff, docx, doc |
| **GEMINI_API_KEY / GEMINI_MODEL** | Google Gemini cho tạo câu hỏi (fallback chain: flash → flash-lite → 2.0-flash) |
| **OCR_LANG / OCR_USE_GPU** | PaddleOCR (vi, en, ch…) |
| **CORS_ORIGINS** | CORS cho frontend (localhost, Electron file:// khi có USER_DATA_PATH) |

`get_config()` chọn `DevelopmentConfig` hoặc `ProductionConfig` theo `FLASK_ENV`.

---

## 4. Database (`app/db.py` + models)

- **app/db.py:** một instance `SQLAlchemy()` — `db`.
- **Tạo bảng:** trong `create_app()`, sau khi import toàn bộ model: `Folder`, `QuizSet`, `Question`, `UploadedFileRecord`, `QuizAttempt` → `db.create_all()`.
- **Migration dữ liệu:** nếu bảng folder trống và có `app/data/folders.json`, dữ liệu được import một lần vào SQLite.

**Các model chính:**

| Model | Feature | Mô tả |
|-------|---------|--------|
| **Folder** | folder | Thư mục/bộ sưu tập (name, description, color) |
| **QuizSet** | quizz | Bộ câu hỏi (gắn folder, nguồn text, metadata) |
| **Question** | quizz | Từng câu hỏi thuộc QuizSet (nội dung, đáp án, giải thích) |
| **UploadedFileRecord** | upload | Bản ghi file đã upload (folder_id, stored_path, …) |
| **QuizAttempt** | stats | Lần làm bài (quiz_set_id, folder_id, score, thời gian) |

---

## 5. Features và API

### 5.1 Folder (`/api/folders`)

- **Blueprint:** `app.features.folder.routes.folder_bp`
- **Logic nghiệp vụ:** `folder_service.py` (get_all_folders, create_folder, update_folder, delete_folder)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/` | Lấy tất cả folder |
| POST | `/` | Tạo folder (name, description, color) |
| PUT | `/<folder_id>` | Cập nhật folder |
| DELETE | `/<folder_id>` | Xóa folder |

---

### 5.2 Quiz (`/api/quiz`)

- **Blueprint:** `app.features.quizz.routes.quiz_bp`
- **Input tạo quiz:** `inputType` = `files` | `youtube` | `text` (multipart/form hoặc form field)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/health` | Health check quiz service |
| GET | `/sets` | Danh sách quiz sets (query: `folder_id`) |
| GET | `/sets/<id>` | Chi tiết một quiz set + câu hỏi |
| DELETE | `/sets/<id>` | Xóa quiz set |
| POST | `/generate` | Tạo quiz từ file/YouTube/text (trích văn → LLM) |
| POST | `/extract-text` | Chỉ trích văn bản (preview), không tạo câu hỏi |

**Luồng chính:**

1. **Trích văn bản:**  
   - **files:** upload → lưu vào `uploads/` → theo loại file gọi `pdf_service`, `docx_service` hoặc `ocr_service`.  
   - **youtube:** `youtube_service` (transcript).  
   - **text:** nhận `rawText` từ form.

2. **Tạo câu hỏi:**  
   - `text_processing`: clean, chunk, chọn đoạn quan trọng.  
   - `quiz_generator`: gọi Gemini (hoặc fallback), parse câu hỏi, validate, lưu `QuizSet` + `Question`.

**File dịch vụ trong `quizz/`:**

- **quiz_generator.py:** prompt, gọi LLM, chunk dài, cache, parse/validate câu hỏi.
- **ocr_service.py:** PaddleOCR cho ảnh (đơn/ nhiều ảnh).
- **pdf_service.py:** pdfplumber + pdf2image; OCR khi cần.
- **docx_service.py:** đọc nội dung DOCX.
- **youtube_service.py:** lấy transcript, tùy chọn summarize.
- **text_processing.py:** clean_text, chunk_text, chunk_importance, select_important_chunks.

---

### 5.3 Upload (`/api/uploads`)

- **Blueprint:** `app.features.upload.routes.upload_bp`
- Chỉ quản lý **bản ghi** file (metadata); file thật lưu trong `UPLOAD_FOLDER` (và có thể được tạo khi gọi `/api/quiz/generate` với inputType=files).

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/` | Danh sách bản ghi upload (query: `folder_id`) |
| DELETE | `/<record_id>` | Xóa bản ghi và xóa file trên đĩa nếu có |

---

### 5.4 Stats (`/api/stats`)

- **Blueprint:** `app.features.stats.routes.stats_bp`
- Dùng model `QuizAttempt` và liên kết `QuizSet`, `Folder`.

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/attempts` | Lưu một lần làm bài (quizSetId, score, …) |
| GET | `/attempts` | Danh sách attempts (query: `folder_id`) |
| GET | `/heatmap` | Dữ liệu heatmap (accuracy theo folder) |
| GET | `/timeline` | Dữ liệu theo thời gian (query: `folder_id`, `period`) |
| GET | `/overview` | Tổng quan thống kê |

---

## 6. Health & chạy ứng dụng

- **GET /api/health** — Health check toàn app (định nghĩa trong `app/__init__.py`).
- **GET /api/quiz/health** — Health check riêng quiz service.

Chạy:

```bash
python app.py
# hoặc
flask run --port 5000
```

Khi có `USER_DATA_PATH` (desktop/Electron): host `127.0.0.1`, debug tắt, CORS cho phép `null`/`file://`.

---

## 7. Dependencies chính (`requirements.txt`)

- **Web:** flask, flask-cors, flask-sqlalchemy, python-dotenv  
- **OCR:** paddlepaddle, paddleocr, opencv-python, pillow, numpy  
- **PDF:** pdfplumber, pdf2image  
- **LLM:** requests, google-generativeai, google-genai  
- **YouTube:** youtube-transcript-api  

---

Tài liệu này mô tả đúng cấu trúc và luồng của back-end hiện tại. Khi thêm feature mới, nên thêm module dưới `app/features/<tên_feature>/` (models, routes, service nếu cần) và đăng ký blueprint trong `app/__init__.py`.
