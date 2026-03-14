# Đóng gói ứng dụng desktop (Windows .exe)

Ứng dụng desktop chạy một file .exe: Electron khởi động backend (Flask đã đóng gói bằng PyInstaller) và mở giao diện React. Dữ liệu (DB, uploads) lưu trong thư mục user data của app.

## Thứ tự build

1. **Build backend** (tạo `WebQuizBackend.exe` và copy vào `front-end/backend/`):
   ```powershell
   cd ..\back-end
   .\build_backend.ps1
   ```
   Cần: Python, `pip install -r requirements.txt`, `pip install pyinstaller`.

2. **Build Electron** (tạo installer/portable trong `dist/`):
   ```powershell
   cd front-end
   npm run dist:win
   ```

   Hoặc **một lệnh** (từ thư mục `front-end`):
   ```powershell
   npm run build:desktop:win
   ```
   Script này gọi `build_backend.ps1` rồi chạy `dist:win`.

## Kết quả

- `dist/` chứa file portable (.exe) hoặc MSI.
- User cài/chạy một file .exe; backend tự chạy với `USER_DATA_PATH` = thư mục user data (ví dụ `%AppData%/com.n-ziermann.front-end`).

## Lưu ý

- Thư mục `front-end/backend/` phải tồn tại (chứa `WebQuizBackend.exe`) khi chạy `dist:win`; nếu chưa build backend thì chạy `build_backend.ps1` trước.
- Chế độ dev (`npm run dev`): không spawn backend; cần chạy `python app.py` trong `back-end` riêng.
