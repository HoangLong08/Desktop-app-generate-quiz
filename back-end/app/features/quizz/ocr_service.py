"""
OCR Service - Extract text from images using Gemini Vision API

Uses the shared Gemini key pool (key_manager) for key rotation.
Tries models in order: gemini-2.5-flash → gemini-2.5-flash-lite → gemini-2.0-flash
On rate-limit (429), falls back to the next model; on full exhaustion, tries the next
available key from the pool.
"""

import os
import base64
import logging
import mimetypes

logger = logging.getLogger(__name__)

_FALLBACK_CHAIN = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"]

_OCR_PROMPT = {
    "vi": (
        "Trích xuất toàn bộ văn bản có trong ảnh này. "
        "Chỉ trả về nội dung văn bản gốc, giữ nguyên xuống dòng và cấu trúc bố cục. "
        "Không thêm giải thích hay chú thích nào khác."
    ),
    "en": (
        "Extract all text from this image. "
        "Return only the raw text content, preserving line breaks and layout. "
        "Do not add any commentary or explanation."
    ),
}


def extract_text_from_image(image_path: str, lang: str = "vi") -> str:
    """
    Extract text from a single image using Gemini Vision API.

    Args:
        image_path: Path to the image file
        lang: Language hint ('vi' or 'en')

    Returns:
        Extracted text as a string

    Raises:
        FileNotFoundError: if the file does not exist
        RuntimeError: if no API keys are available or all models fail
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")

    import google.generativeai as genai
    from app.features.api_keys.key_manager import get_optimal_key, record_success, record_error

    mime_type = mimetypes.guess_type(image_path)[0] or "image/png"
    with open(image_path, "rb") as fh:
        b64_data = base64.b64encode(fh.read()).decode()

    prompt = _OCR_PROMPT.get(lang, _OCR_PROMPT["en"])
    tried_key_ids: list[str] = []

    while True:
        key_obj = get_optimal_key(exclude_ids=tried_key_ids)
        if not key_obj:
            suffix = f" (đã thử {len(tried_key_ids)} key)" if tried_key_ids else ""
            raise RuntimeError(
                f"Không có Gemini API key khả dụng{suffix}. Vào Settings > API Keys để thêm key."
            )

        tried_key_ids.append(key_obj.id)
        genai.configure(api_key=key_obj.key)
        any_rate_limited = False

        for model_name in _FALLBACK_CHAIN:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content([
                    {"inline_data": {"mime_type": mime_type, "data": b64_data}},
                    prompt,
                ])
                extracted = (response.text or "").strip()

                input_tok = output_tok = 0
                try:
                    usage = response.usage_metadata
                    if usage:
                        input_tok = getattr(usage, "prompt_token_count", 0) or 0
                        output_tok = getattr(usage, "candidates_token_count", 0) or 0
                except Exception:
                    pass

                record_success(key_obj.id, input_tok, output_tok)
                logger.info(
                    "Gemini OCR (%s): %d chars from %s",
                    model_name, len(extracted), os.path.basename(image_path),
                )
                return extracted

            except Exception as e:
                err_str = str(e).lower()
                is_rate_limit = (
                    "429" in err_str
                    or "resource_exhausted" in err_str
                    or "resourceexhausted" in err_str
                )
                record_error(key_obj.id, str(e)[:500], is_rate_limit=is_rate_limit)
                logger.warning(
                    "Gemini %s OCR failed (key …%s): %s",
                    model_name, key_obj.id[-6:], str(e)[:120],
                )
                if not is_rate_limit:
                    # Non-quota error (invalid key, content policy, etc.) — stop immediately
                    raise
                any_rate_limited = True
                # Rate-limit: try the next model in the chain

        if any_rate_limited:
            # All models rate-limited for this key — try the next available key
            logger.warning(
                "All models rate-limited for key …%s, trying another key…", key_obj.id[-6:]
            )


def extract_text_from_images(image_paths: list[str], lang: str = "vi") -> str:
    """
    Extract text from multiple image files.

    Args:
        image_paths: List of image file paths
        lang: Language hint

    Returns:
        Combined extracted text
    """
    all_texts = []
    for path in image_paths:
        try:
            text = extract_text_from_image(path, lang=lang)
            if text.strip():
                all_texts.append(text)
        except Exception as e:
            logger.error("Error processing image %s: %s", path, e)

    return "\n\n".join(all_texts)
