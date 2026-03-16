# Gemini API Key Pool Guide

> This project uses a **multi-key pool** system — API keys are stored in the SQLite database
> and managed via the UI (Settings > API Keys). The `GEMINI_API_KEY` environment variable is not used.

---

## 1. Getting an API Key

1. Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with a Google account → **Create API Key**
3. Select a Google Cloud project (or create a new one)
4. Copy the key in the format `AIzaSy...`

> **Free Tier limits (e.g., gemini-2.5-flash):** 15 RPM · 500 RPD · 1,000,000 TPM

---

## 2. Adding Keys to the System

Keys are **NOT** stored in the `.env` file. Instead:

1. Open the app → **Settings > API Keys**
2. Click **Add Key** → paste the key → set a label (optional)
3. The key is saved to the `gemini_api_keys` table in SQLite

Or call the API directly:

```bash
curl -X POST http://localhost:5050/api/keys \
  -H "Content-Type: application/json" \
  -d '{"key": "AIzaSy...", "label": "Key 1"}'
```

### API Endpoints

| Method | Endpoint           | Description                       |
| ------ | ------------------ | --------------------------------- |
| GET    | `/api/keys`        | List keys (masked) + pool summary |
| POST   | `/api/keys`        | Add a new key                     |
| PUT    | `/api/keys/<id>`   | Update label / toggle status      |
| DELETE | `/api/keys/<id>`   | Delete a key                      |
| GET    | `/api/keys/models` | List models + rate limits         |

---

## 3. Key Pool Architecture

```
UI (Settings > API Keys)
  └─► routes.py         CRUD endpoints → SQLite table `gemini_api_keys`
        └─► key_manager.py   get_optimal_key() → round-robin LRU
              └─► genai.configure(api_key=key_obj.key)
                    └─► quiz_generator / ocr_service / youtube_service
```

### 3.1 Model `GeminiApiKey` (`models.py`)

The `gemini_api_keys` table stores:

| Column                | Description                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| `id`                  | UUID                                                                      |
| `label`               | Memorable name                                                            |
| `key`                 | API key (unique)                                                          |
| `status`              | `active` · `cooldown` · `disabled`                                        |
| `usage_count`         | Total successful requests                                                 |
| `error_count`         | Total errors                                                              |
| `total_input_tokens`  | Total input tokens                                                        |
| `total_output_tokens` | Total output tokens                                                       |
| `model_usage`         | JSON — per-model stats `{model: {requests, input_tokens, output_tokens}}` |
| `last_used_at`        | Last used timestamp                                                       |
| `cooldown_until`      | Cooldown expiry time (if currently in cooldown)                           |

### 3.2 Key Manager (`key_manager.py`)

```python
from app.features.api_keys.key_manager import get_optimal_key, record_success, record_error
```

| Function                                                           | Description                                                                                     |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `get_optimal_key(exclude_ids)`                                     | Select active key, prioritizing LRU (least-recently-used). Auto-recovers expired cooldown keys. |
| `record_success(key_id, input_tokens, output_tokens, model_stats)` | Record success + per-model token usage                                                          |
| `record_error(key_id, error_msg, is_rate_limit)`                   | Record error. If rate limited → put key in cooldown for 65 seconds                              |
| `get_pool_summary()`                                               | Aggregate stats: active/cooldown/disabled keys, tokens, per-model usage                         |

**Key lifecycle:**

```
active ──[429 error]──► cooldown (65s) ──[expired]──► active
   │                                                      │
   └──[user disable]──► disabled ──[user enable]──────────┘
```

---

## 4. Model Fallback Chain

```python
# config.py
GEMINI_FALLBACK_CHAIN = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"]
```

When calling the API, the system tries each model sequentially. If a model returns 429 → switch to the next model.
If all models return 429 for the current key → switch to the next key in the pool.

### Free Tier Limits

| Model                   | RPD   | RPM | TPM       |
| ----------------------- | ----- | --- | --------- |
| `gemini-2.5-flash`      | 500   | 15  | 1,000,000 |
| `gemini-2.5-flash-lite` | 500   | 30  | 1,000,000 |
| `gemini-2.0-flash`      | 1,500 | 15  | 4,000,000 |

---

## 5. How Services Use the Key Pool

All services retrieve keys from the database via `get_optimal_key()`, **not** from environment variables.

### Quiz Generator (`quiz_generator.py`)

```python
key_obj = get_optimal_key(exclude_ids=tried_key_ids)
genai.configure(api_key=key_obj.key)
# Call model following fallback chain, retry with another key if all models return 429
```

### OCR Service (`ocr_service.py`)

```python
key_obj = get_optimal_key(exclude_ids=tried_key_ids)
genai.configure(api_key=key_obj.key)
model = genai.GenerativeModel(model_name)
response = model.generate_content([image_data, prompt])
record_success(key_obj.id, input_tok, output_tok)
```

### YouTube Service (`youtube_service.py`)

Used for `summarize_transcript()` and `normalize_transcript()` — receives `api_key` as a parameter,
the key is retrieved from the pool at the caller.

---

## 6. Error Handling

| Error                                | Behavior                                         |
| ------------------------------------ | ------------------------------------------------ |
| 429 / `resource_exhausted` / `quota` | Cooldown key 65s → try next model → try next key |
| 401 / 403 / `invalid api key`        | Stop immediately, raise error                    |
| Other errors                         | Re-raise, log + return 500                       |

When **all** keys in the pool are quota-exhausted or in cooldown:

```
RuntimeError: "No available Gemini API key (tried N keys).
Go to Settings > API Keys to add a key."
```

---

## 7. Security

| Practice                                   | Reason                                      |
| ------------------------------------------ | ------------------------------------------- |
| Keys stored in SQLite, not in `.env`       | Centralized management via UI               |
| Keys displayed masked as `AIza•••••ef12`   | Full key not exposed in the UI              |
| `.env` and `instance/` are in `.gitignore` | Database containing keys won't be committed |
| Rotate keys periodically                   | Reduce risk if a key is compromised         |

---

## 8. References

- [Google AI Studio – Create API Key](https://aistudio.google.com/app/apikey)
- [Gemini API Python SDK](https://ai.google.dev/gemini-api/docs/quickstart?lang=python)
- [Rate Limits by tier](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Model list and limits](https://ai.google.dev/gemini-api/docs/models/gemini)
