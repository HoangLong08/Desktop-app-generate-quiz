# PaddleOCR App - Hướng dẫn nhanh

## Bắt đầu nhanh (cho người mới)

### Bước 1: Cài đặt
Double-click vào file `install.bat` và đợi cài đặt hoàn tất.

### Bước 2: Chạy app
Double-click vào file `run.bat`

### Bước 3: Test nhanh
Chạy file `test_simple.py` để test đơn giản:
```bash
venv\Scripts\activate
python test_simple.py
```

## Các file trong project

| File | Mô tả |
|------|-------|
| `app.py` | App chính với đầy đủ chức năng OCR |
| `test_simple.py` | Script test đơn giản |
| `requirements.txt` | Danh sách packages cần cài |
| `install.bat` | Script cài đặt tự động |
| `run.bat` | Script chạy app |
| `build.bat` | Script đóng gói thành file .exe |
| `README.md` | Hướng dẫn chi tiết |

## Sử dụng nhanh

### 1. OCR một ảnh
```python
from paddleocr import PaddleOCR

ocr = PaddleOCR(use_angle_cls=True, lang='vi', use_gpu=False)
result = ocr.ocr('anh_cua_ban.jpg', cls=True)

# In kết quả
for line in result[0]:
    print(line[1][0])  # Text
```

### 2. Thay đổi ngôn ngữ
Sửa trong `app.py`:
```python
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='en',  # 'vi', 'en', 'ch', 'korean', 'japan', ...
    use_gpu=False
)
```

### 3. Sử dụng GPU (nếu có)
```python
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='vi',
    use_gpu=True  # Đổi thành True
)
```

## Đóng gói thành file .exe

1. Chạy `build.bat`
2. File exe sẽ ở trong folder `dist/`
3. Copy file `PaddleOCR_App.exe` sang máy khác để chạy

**Lưu ý:** 
- File exe khá lớn (~200-300MB) vì chứa toàn bộ PaddlePaddle
- Lần chạy đầu tiên sẽ tải models (~10-50MB)
- Models được cache để lần sau chạy nhanh hơn

## Các chức năng của app.py

1. **OCR một ảnh**: Nhận diện text từ 1 ảnh
2. **OCR nhiều ảnh**: Xử lý hàng loạt ảnh trong folder
3. **OCR và vẽ kết quả**: Nhận diện và vẽ box lên ảnh

## Troubleshooting

### App không chạy?
```bash
# Kiểm tra Python
python --version

# Phải là Python 3.9 - 3.13
```

### Lỗi import paddle?
```bash
# Cài lại
venv\Scripts\activate
pip uninstall paddlepaddle
pip install paddlepaddle==3.3.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
```

### Build exe bị lỗi?
```bash
# Thử build với tùy chọn đơn giản hơn
pyinstaller --onefile app.py
```

## Liên hệ & Hỗ trợ

- **PaddleOCR GitHub**: https://github.com/PaddlePaddle/PaddleOCR
- **PaddlePaddle Docs**: https://www.paddlepaddle.org.cn/
- **Issue tracker**: https://github.com/PaddlePaddle/PaddleOCR/issues

## License

PaddleOCR is Apache 2.0 licensed.
