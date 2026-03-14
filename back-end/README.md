# Hướng dẫn cài đặt và đóng gói PaddleOCR App

## 1. Cài đặt vào folder local (để đóng gói)

### Cách 1: Cài vào thư mục `packages` trong project

```powershell
# Tạo thư mục packages
mkdir packages

# Cài đặt PaddlePaddle CPU version
python -m pip install --target=./packages paddlepaddle==3.3.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/

# Cài đặt PaddleOCR
python -m pip install --target=./packages paddleocr
```

### Cách 2: Sử dụng virtual environment (khuyến nghị)

```powershell
# Tạo virtual environment
python -m venv venv

# Kích hoạt virtual environment
.\venv\Scripts\activate

# Cài đặt từ requirements.txt
pip install -r requirements.txt

# Hoặc cài thủ công
pip install paddlepaddle==3.3.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
pip install paddleocr
```

## 2. Kiểm tra cài đặt

```powershell
# Nếu dùng venv, kích hoạt trước:
.\venv\Scripts\activate

# Kiểm tra PaddlePaddle
python -c "import paddle; paddle.utils.run_check()"

# Kiểm tra PaddleOCR
python -c "import paddleocr; print('PaddleOCR đã cài đặt thành công!')"
```

## 3. Chạy ứng dụng

```powershell
# Nếu dùng venv:
.\venv\Scripts\activate
python app.py

# Hoặc nếu cài local vào packages:
python app.py
```

**Cấu hình LLM (quiz generation):** App chỉ dùng **Google Gemini**. Trong `.env` (hoặc copy từ `.env.example`) đặt `GEMINI_API_KEY` (lấy key tại https://aistudio.google.com/apikey). Tùy chọn: `GEMINI_MODEL=gemini-2.0-flash`.

## 4. Sử dụng

App hỗ trợ 3 chức năng:

1. **OCR một ảnh**: Nhận diện text từ 1 file ảnh
2. **OCR nhiều ảnh**: Xử lý hàng loạt ảnh trong folder
3. **OCR và vẽ kết quả**: Nhận diện và vẽ bounding box lên ảnh

## 5. Đóng gói ứng dụng

### Sử dụng PyInstaller

```powershell
# Cài đặt PyInstaller
pip install pyinstaller

# Tạo file exe (single file)
pyinstaller --onefile --name PaddleOCR_App app.py

# Hoặc tạo folder với dependencies
pyinstaller --onedir --name PaddleOCR_App app.py

# File exe sẽ nằm trong folder dist/
```

### Tùy chọn nâng cao cho PyInstaller

```powershell
# Thêm icon, ẩn console
pyinstaller --onefile --noconsole --icon=icon.ico --name PaddleOCR_App app.py

# Thêm data files (nếu có models hoặc configs)
pyinstaller --onefile --add-data "models;models" --name PaddleOCR_App app.py
```

## 6. GPU Version (nếu có NVIDIA GPU)

Nếu máy bạn có GPU NVIDIA với compute capability > 7.5:

```powershell
# Kiểm tra CUDA version
nvidia-smi

# Cài PaddlePaddle GPU (ví dụ CUDA 11.8)
pip install paddlepaddle-gpu==3.3.0 -i https://www.paddlepaddle.org.cn/packages/stable/cu118/

# Sửa trong app.py:
# use_gpu=True  # thay vì False
```

## 7. Ngôn ngữ hỗ trợ

PaddleOCR hỗ trợ nhiều ngôn ngữ, thay đổi trong `init_ocr()`:

- `lang='vi'` - Tiếng Việt
- `lang='en'` - Tiếng Anh
- `lang='ch'` - Tiếng Trung
- `lang='korean'` - Tiếng Hàn
- `lang='japan'` - Tiếng Nhật
- ... và nhiều ngôn ngữ khác

## 8. Troubleshooting

### Lỗi import paddle

```powershell
# Kiểm tra Python version (cần 3.9-3.13)
python --version

# Cài lại PaddlePaddle
pip uninstall paddlepaddle
pip install paddlepaddle==3.3.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
```

### Lỗi thiếu dependencies

```powershell
# Cài đầy đủ dependencies
pip install opencv-python pillow numpy
```

### PyInstaller không tìm thấy modules

```powershell
# Thêm hidden imports
pyinstaller --onefile --hidden-import=paddleocr --hidden-import=paddle --name PaddleOCR_App app.py
```

## 9. Đóng gói desktop (Electron + PyInstaller)

Để tạo ứng dụng desktop Windows (một file .exe hoặc installer) chạy cả backend và frontend:

1. **Build backend (PyInstaller onedir):**
   ```powershell
   cd back-end
   pip install pyinstaller
   .\build_backend.ps1
   ```
   Script này chạy `pyinstaller WebQuizBackend.spec` và copy thư mục `dist/WebQuizBackend` sang `front-end/backend/`.

2. **Build Electron (từ thư mục front-end):**
   ```powershell
   cd front-end
   npm run dist:win
   ```
   Hoặc gộp một lệnh (từ thư mục front-end): `npm run build:desktop:win` (sẽ gọi build backend rồi dist:win).

3. Kết quả: file portable (.exe) hoặc MSI trong `front-end/dist/`. Khi chạy, Electron tự khởi động backend với `USER_DATA_PATH` trỏ tới thư mục user data của app (DB và uploads lưu tại đó).

## 10. Cấu trúc project khi đóng gói

```
web-quizz/
  back-end/
  ├── app.py                              # Entry point (Flask server trên port 5000)
  ├── config.py                           # Config (Gemini key, upload, CORS)
  ├── .env.example                        # Template env variables
  ├── requirements.txt                    # Updated dependencies
  ├── WebQuizBackend.spec                 # PyInstaller spec cho desktop build
  ├── build_backend.ps1                   # Script build backend + copy sang front-end
  └── app/
      ├── __init__.py                     # Flask app factory + CORS + blueprint
      └── features/quizz/
          ├── routes.py                   # API endpoints
          ├── ocr_service.py             # PaddleOCR text extraction
          ├── pdf_service.py             # PDF text extraction (pdfplumber + fallback OCR)
          ├── text_processing.py         # Text cleaning & chunking
          └── quiz_generator.py          # Google Gemini quiz generation
```

## 11. Ghi chú

- PaddlePaddle package khá lớn (~100MB), exe file sẽ nặng
- Lần chạy đầu tiên sẽ tải models về (~10-50MB tùy ngôn ngữ)
- Models được cache tại `C:\Users\YourName\.paddleocr\`
- Để giảm kích thước, có thể bundle sẵn models vào package
