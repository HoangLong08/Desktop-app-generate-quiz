# Hướng dẫn cài đặt và chạy Local

Hướng dẫn chi tiết để chạy Quiz Generator trên máy local (development mode).

---

## Yêu cầu hệ thống

| Tool        | Phiên bản | Kiểm tra           |
| ----------- | --------- | ------------------ |
| **Node.js** | >= 18     | `node --version`   |
| **npm**     | >= 9      | `npm --version`    |
| **Python**  | >= 3.10   | `python --version` |
| **Git**     | bất kỳ    | `git --version`    |

---

## 1. Clone dự án

```bash
git clone https://github.com/<your-username>/web-quizz.git
cd web-quizz
```

---

## 2. Cài đặt Backend

```bash
cd back-end
```

### 2.1 Tạo virtual environment (khuyến nghị)

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2.2 Cài dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Cấu hình environment

Tạo file `.env` trong thư mục `back-end/`:

```env
# Bắt buộc nếu muốn tạo quiz (lấy key tại https://aistudio.google.com/apikey)
# Hoặc có thể thêm key qua giao diện Settings trong app
GEMINI_API_KEY=your_api_key_here

# Tuỳ chọn
SECRET_KEY=your-random-secret-key
FLASK_ENV=development
```

> **Gemini API Key:** Bạn có thể lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/apikey). Hoặc thêm key trực tiếp trong app tại trang **Settings > API Keys**.

### 2.4 Chạy backend

```bash
python app.py
```

Backend sẽ chạy tại `http://localhost:5000`. Kiểm tra bằng cách truy cập `http://localhost:5000/api/health`.

---

## 3. Cài đặt Frontend

Mở **terminal mới**, giữ backend đang chạy:

```bash
cd front-end
npm install
```

### 3.1 Chạy Web (chỉ trình duyệt)

```bash
npm run dev:react
```

Mở trình duyệt tại **http://localhost:5123**

### 3.2 Chạy Desktop (Electron)

```bash
npm run dev
```

Lệnh này chạy song song Vite dev server + Electron app. Cửa sổ desktop sẽ tự mở.

---

## 4. Build Desktop App

### Build cho Windows

```bash
cd front-end
npm run dist:win
```

File output tại `front-end/dist/`:

- `front-end 0.0.0.exe` — Portable (chạy trực tiếp)
- `front-end 0.0.0.msi` — Installer

### Build cho macOS

```bash
npm run dist:mac
```

### Build cho Linux

```bash
npm run dist:linux
```

### Build đầy đủ (kèm backend đóng gói)

```bash
npm run build:desktop:win
```

Lệnh này sẽ đóng gói backend (PyInstaller) + frontend (Electron) thành một app desktop hoàn chỉnh.

---

## 5. Cấu hình nâng cao

### Đổi cổng backend

```bash
# Sử dụng biến môi trường PORT
PORT=8000 python app.py
```

### Đổi API URL cho frontend

```bash
# Khi backend chạy ở port khác
VITE_API_URL=http://localhost:8000 npm run dev:react
```

### CORS

Backend mặc định cho phép các origin:

- `http://localhost:5123` (Vite dev)
- `http://localhost:5173`
- `http://localhost:3000`
- `http://localhost:4173` (Vite preview)

Để thêm origin khác, set biến `CORS_ORIGINS` trong `.env`:

```env
CORS_ORIGINS=http://localhost:5123,http://localhost:3000,https://your-domain.com
```

---

## 6. Cấu trúc API

| Method | Endpoint                 | Mô tả                |
| ------ | ------------------------ | -------------------- |
| GET    | `/api/health`            | Health check         |
| GET    | `/api/folders/`          | Danh sách thư mục    |
| POST   | `/api/folders/`          | Tạo thư mục          |
| POST   | `/api/quiz/generate`     | Tạo quiz từ tài liệu |
| POST   | `/api/quiz/extract-text` | Trích xuất văn bản   |
| GET    | `/api/quiz/sets`         | Danh sách bộ quiz    |
| GET    | `/api/stats/overview`    | Thống kê tổng quan   |
| POST   | `/api/stats/attempts`    | Lưu lần làm bài      |
| GET    | `/api/keys/`             | Danh sách API keys   |

Xem chi tiết API tại [back-end/ARCHITECTURE.md](../back-end/ARCHITECTURE.md).

---

## Khắc phục sự cố

### Backend không khởi động

```bash
# Kiểm tra port 5000 có bị chiếm không
netstat -ano | findstr ":5000"    # Windows
lsof -i :5000                     # macOS/Linux
```

### CORS error trên trình duyệt

Đảm bảo origin của frontend nằm trong `CORS_ORIGINS` config. Xem mục [CORS](#cors) ở trên.

### Electron disk_cache warnings

Các lỗi `disk_cache` / `gpu_disk_cache` khi chạy Electron là warnings bình thường của Chromium, không ảnh hưởng hoạt động app.
