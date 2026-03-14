# Hướng dẫn cấu hình & sử dụng GEMINI_API_KEY

> Tài liệu này giải thích toàn bộ luồng hoạt động của `GEMINI_API_KEY` trong dự án này,
> cùng với các best-practice để tái sử dụng ở dự án khác.

---

## 1. Lấy API Key

1. Truy cập [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Đăng nhập tài khoản Google → **Create API Key**
3. Chọn project Google Cloud (hoặc tạo mới)
4. Copy key dạng `AIzaSy...`

> **Free Tier giới hạn:** 30 RPM · 1.500 RPD · 1.000.000 TPM (gemini-2.5-flash)

---

## 2. Cấu hình trong dự án này

### Luồng đọc key: `.env` → `config.py` → `gemini_client.py`

```
.env  (project root)
  └─► app/config.py          python-dotenv đọc file .env
        └─► Flask app.config  GEMINI_API_KEY nằm trong app.config
              └─► gemini_client.py  _ensure_configured() lấy từ current_app.config
```

### 2.1 File `.env` (project root)

```dotenv
GEMINI_API_KEY=AIzaSy...
BE_PORT=5050
```

> File này **KHÔNG commit** lên git. Xem `.gitignore`.

### 2.2 `backend/app/config.py`

```python
from dotenv import load_dotenv
import os

load_dotenv(env_path)          # load .env từ project root

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
```

`load_dotenv()` đọc `.env` → ghi vào `os.environ` → `os.getenv()` lấy ra.

### 2.3 `backend/app/services/gemini_client.py`

```python
import google.generativeai as genai

def _ensure_configured():
    api_key = current_app.config.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set")
    genai.configure(api_key=api_key)   # ← cấu hình SDK 1 lần duy nhất
```

SDK được khởi tạo **lazy** (lần đầu dùng) và cache lại qua biến module `_genai`.

---

## 3. Model được dùng

```python
MODEL = "gemini-2.5-flash"
```

- Khởi tạo **một lần** qua biến `_gen_model` (singleton)
- Chat multi-turn tạo model mới mỗi lần (do cần `system_instruction` khác nhau)

---

## 4. Ba hàm gọi Gemini

| Hàm | Dùng khi | Ghi chú |
|-----|----------|---------|
| `generate_text(prompt)` | Single-turn, bất kỳ prompt | Dùng cho routing, RAG |
| `generate_content(system_prompt, user_message)` | Single-turn có system prompt | Phân tích tài liệu |
| `generate_chat(system_prompt, messages, new_msg)` | Multi-turn chat có lịch sử | BA conversation |

### `generate_text`
```python
response = model.generate_content(prompt)
return response.text
```

### `generate_content`
```python
full_prompt = f"{system_prompt}\n\n---\n\nDocument:\n\n{user_message}"
return generate_text(full_prompt)
```
> Ghép system + user thành 1 prompt vì single-turn không có `system_instruction`.

### `generate_chat`
```python
model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_prompt)
chat  = model.start_chat(history=history)
response = chat.send_message(new_user_content)
```
> Gemini dùng role `"model"` (không phải `"assistant"`) trong history.

---

## 5. Rate Limiter (`rate_limiter.py`)

Tracker **in-memory** theo dõi:

| Metric | Free Tier | Reset |
|--------|-----------|-------|
| RPM (Requests/Minute) | 30 | Cửa sổ 60 giây liên tục |
| RPD (Requests/Day)    | 1.500 | Midnight Pacific Time |

```python
# Ghi nhận mỗi request trước khi gọi API
record_request()

# Ghi nhận khi nhận 429
record_429()

# Kiểm tra trạng thái
get_status() → { rpm_current, rpd_current, rpm_limit, rpd_limit, ... }
```

> ⚠️ Tracker này chỉ là **ước tính cục bộ** — không đồng bộ với quota thực của Google.

---

## 6. Xử lý lỗi

Hai exception tùy chỉnh:

```python
class GeminiRateLimitError(Exception): ...  # HTTP 429 / quota exhausted
class GeminiAuthError(Exception):      ...  # HTTP 401/403 / key không hợp lệ
```

### Bảng phân loại lỗi

| HTTP / keyword | Exception | Xử lý |
|----------------|-----------|-------|
| 429, `resource_exhausted`, `quota` | `GeminiRateLimitError` | Trả 429 cho client |
| 401, 403, `invalid api key`, `permission_denied` | `GeminiAuthError` | Trả 401 cho client |
| Khác | re-raise gốc | Log + trả 500 |

### Validate key trước khi dùng

```python
result = validate_api_key()
# result = {"valid": True, "error": None}
# result = {"valid": False, "error": "API key không hợp lệ..."}
# result = {"valid": True,  "error": "Đã hết quota..."}  ← key đúng nhưng hết quota
```

Key check được **cache 120 giây** (`KEY_CHECK_TTL`).

---

## 7. Checklist tái sử dụng trong dự án mới

### Cài đặt

```bash
pip install google-generativeai python-dotenv
```

### Cấu hình tối thiểu

**`.env`** (không commit):
```dotenv
GEMINI_API_KEY=AIzaSy...
```

**`config.py`**:
```python
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MODEL_ID = "gemini-2.5-flash"   # hoặc gemini-1.5-pro
```

### Template client tối giản

```python
import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# Single-turn
def ask(prompt: str) -> str:
    response = model.generate_content(prompt)
    return response.text or ""

# Multi-turn chat
def chat(system: str, history: list[dict], user_msg: str) -> str:
    m = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system)
    c = m.start_chat(history=[
        {"role": ("model" if h["role"] == "assistant" else "user"), "parts": [h["content"]]}
        for h in history
    ])
    return c.send_message(user_msg).text or ""
```

### Xử lý lỗi cơ bản

```python
try:
    result = ask("Hello")
except Exception as e:
    err = str(e).lower()
    if "429" in err or "quota" in err or "resource_exhausted" in err:
        print("Rate limit! Chờ 60s hoặc đợi reset ngày mới.")
    elif "401" in err or "403" in err or "invalid api key" in err:
        print("API Key không hợp lệ. Kiểm tra GEMINI_API_KEY.")
    else:
        raise
```

---

## 8. Chọn Model phù hợp

| Model | Tốc độ | Chất lượng | Free Tier |
|-------|--------|------------|-----------|
| `gemini-2.5-flash` | ⚡⚡⚡ Rất nhanh | Tốt | ✅ 30 RPM |
| `gemini-2.5-pro`  | ⚡ Chậm hơn | Rất cao | ✅ 5 RPM |
| `gemini-1.5-flash` | ⚡⚡ Nhanh | Tốt | ✅ |

**Khuyến nghị:** Dùng `gemini-2.5-flash` cho production nhờ tốc độ và quota cao nhất ở free tier.

---

## 9. Bảo mật

| Việc cần làm | Lý do |
|--------------|-------|
| Thêm `.env` vào `.gitignore` | Không lộ key lên git |
| Không hardcode key trong code | Key có thể bị lộ qua log/error |
| Dùng biến môi trường trên server | Không cần file `.env` trên production |
| Rotate key định kỳ | Hạn chế rủi ro nếu bị lộ |

```gitignore
# .gitignore
.env
*.env
```

---

## 10. Tham khảo thêm

- [Google AI Studio – Tạo API Key](https://aistudio.google.com/app/apikey)
- [Gemini API Python SDK](https://ai.google.dev/gemini-api/docs/quickstart?lang=python)
- [Rate Limits theo tier](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Model danh sách và giới hạn](https://ai.google.dev/gemini-api/docs/models/gemini)
