"""
YouTube Service - Extract transcript/subtitles from YouTube videos
using youtube-transcript-api.
"""

import re
import logging
from typing import Optional, List

logger = logging.getLogger(__name__)


def extract_video_id(url: str) -> Optional[str]:
    """
    Extract YouTube video ID from various URL formats:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/shorts/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    """
    patterns = [
        r"(?:youtube\.com/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})",
        r"(?:youtu\.be/)([A-Za-z0-9_-]{11})",
        r"(?:youtube\.com/(?:shorts|embed)/)([A-Za-z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def extract_transcript(url: str, lang: str = "vi") -> str:
    """
    Extract transcript text from a YouTube video.

    Tries languages in order:
    1. Requested lang (manual, then auto-generated)
    2. English ('en') as fallback
    3. Any available language as last resort

    Args:
        url: YouTube video URL
        lang: Preferred transcript language code (e.g. 'vi', 'en', 'ja', 'ko', 'zh-Hans')

    Returns:
        Transcript as plain text

    Raises:
        ValueError: If URL is invalid or no transcript available
        RuntimeError: If youtube-transcript-api is not installed
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        # Exception classes moved around between v0.x and v1.x — import defensively
        try:
            from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled
        except ImportError:
            try:
                from youtube_transcript_api._errors import (
                    NoTranscriptFound,
                    TranscriptsDisabled,
                )
            except ImportError:
                # Last resort: treat any exception as the target error
                NoTranscriptFound = Exception
                TranscriptsDisabled = Exception
    except ImportError:
        raise RuntimeError(
            "youtube-transcript-api is not installed. "
            "Run: pip install youtube-transcript-api"
        )

    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError(f"Invalid YouTube URL: {url!r}")

    logger.info(f"Fetching transcript for video_id={video_id}, lang={lang}")

    # Support both v0.x (class methods) and v1.x (instance methods)
    _use_new_api = not hasattr(YouTubeTranscriptApi, "list_transcripts")

    try:
        if _use_new_api:
            api = YouTubeTranscriptApi()
            transcript_list = api.list(video_id)
        else:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
    except TranscriptsDisabled:
        raise ValueError("This video has transcripts/captions disabled.")
    except Exception as e:
        raise ValueError(f"Could not fetch transcripts for video: {e}") from e

    transcript = None

    # 1. Try requested language first
    try:
        transcript = transcript_list.find_transcript([lang])
    except NoTranscriptFound:
        pass

    # 2. Fallback to English (if requested lang was not English)
    if transcript is None and lang != "en":
        try:
            transcript = transcript_list.find_transcript(["en"])
            logger.info(f"Falling back to English transcript for video_id={video_id}")
        except NoTranscriptFound:
            pass

    # 3. Fallback to any available transcript
    if transcript is None:
        for t in transcript_list:
            transcript = t
            logger.info(
                f"Using any available transcript: lang={t.language_code}, "
                f"generated={t.is_generated}"
            )
            break

    if transcript is None:
        raise ValueError("No transcripts available for this video.")

    entries = transcript.fetch()

    lines = []
    for entry in entries:
        # v1.x: FetchedTranscriptSnippet objects with .text attribute
        # v0.x: dicts with "text" key
        if hasattr(entry, "text"):
            text_val = str(entry.text).strip()
        else:
            text_val = str(entry.get("text", "")).strip()
        if text_val:
            lines.append(text_val)

    text = " ".join(lines)

    logger.info(
        f"Extracted {len(lines)} transcript segments ({len(text)} chars) "
        f"from video_id={video_id}"
    )
    return text


# ---------------------------------------------------------------------------
# Transcript summarization — condense long transcripts into a rich outline
# ---------------------------------------------------------------------------

_SUMMARIZE_PROMPT = """\
Bạn là chuyên gia tóm tắt nội dung kỹ thuật và giáo dục. \
Dưới đây là transcript đầy đủ của một video (có thể rất dài). \
Hãy tóm tắt thành outline chi tiết bằng ngôn ngữ giống ngôn ngữ của transcript, theo yêu cầu sau:

1. Chia theo các phần/chủ đề chính được giảng dạy.
2. Liệt kê đầy đủ: khái niệm kỹ thuật, ví dụ code nổi bật, best practices, lỗi thường gặp, so sánh phương pháp.
3. Giữ nguyên các từ chuyên môn tiếng Anh (arrow function, async/await, React Hooks, v.v.).
4. Sửa các lỗi ASR phổ biến trong tiếng Việt (ví dụ: "rau fashion" → "arrow function").
5. KHÔNG bịa thêm thông tin ngoài transcript.
6. Độ dài tóm tắt: 6.000–10.000 ký tự.
7. Trả về ONLY văn bản outline thuần túy, KHÔNG markdown heading đặc biệt, KHÔNG chú thích thêm.

Transcript:
"""


def summarize_transcript(
    text: str,
    api_key: str,
    model_chain: Optional[List[str]] = None,
) -> str:
    """
    Use Gemini to summarize a long transcript into a dense outline (~8 000 chars).

    This single pass:
    - Reduces 200k–500k char transcripts to ~8 000 chars (80-90% token saving).
    - Covers the whole video (not just the intro).
    - Fixes ASR errors as a side effect (combines normalize + summarize).
    - Falls back silently to smart-sampled raw text if the LLM call fails.

    Args:
        text: Full raw transcript text
        api_key: Gemini API key
        model_chain: Models to try in order (falls back on 429)

    Returns:
        Summarized outline text (or first 40 000 chars of original on error)
    """
    if not text.strip() or not api_key:
        return text

    if model_chain is None:
        model_chain = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"]

    # Gemini 2.5-flash has a 1M token context window.
    # 800 000 chars ≈ 150 000–200 000 tokens — well within limits for summarization.
    MAX_INPUT_CHARS = 800_000
    truncated = text[:MAX_INPUT_CHARS] if len(text) > MAX_INPUT_CHARS else text
    prompt = _SUMMARIZE_PROMPT + truncated

    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=api_key)

        last_err: Exception | None = None
        for model_name in model_chain:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.2,
                        max_output_tokens=8192,
                    ),
                )
                summary = (response.text or "").strip()
                if summary and len(summary) >= 500:
                    logger.info(
                        "Transcript summarized via %s: %d → %d chars (%.1f%% reduction)",
                        model_name, len(text), len(summary),
                        (1 - len(summary) / len(text)) * 100,
                    )
                    return summary
                logger.warning(
                    "Summarization on %s returned too short (%d chars) — trying next model",
                    model_name, len(summary),
                )
            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str and ("daily" in err_str or "per day" in err_str or "quota" in err_str):
                    logger.warning("Summarize: RPD quota on %s, trying next model", model_name)
                    last_err = e
                    continue
                if "429" in err_str:
                    logger.warning("Summarize: RPM limit on %s, skipping to next", model_name)
                    last_err = e
                    continue
                logger.warning("Summarize failed on %s: %s", model_name, e)
                last_err = e
                continue

        logger.warning("All models failed for summarization (%s) — falling back to raw excerpt", last_err)

    except Exception as e:
        logger.warning("Transcript summarization skipped: %s — falling back to raw excerpt", e)

    # Fallback: return a smart-sampled slice of the raw text ≤ 40 000 chars
    if len(text) <= 40_000:
        return text
    # Sample beginning + middle + end
    chunk = 12_000
    return (
        text[:chunk]
        + "\n\n[...]\ \n\n"
        + text[len(text) // 2 - chunk // 2: len(text) // 2 + chunk // 2]
        + "\n\n[...]\n\n"
        + text[-chunk:]
    )


# ---------------------------------------------------------------------------
# Transcript normalization — fix ASR phonetic errors for tech/edu content
# ---------------------------------------------------------------------------

_NORMALIZE_PROMPT = """\
The following text is a Vietnamese automatic transcript (ASR) of a video about \
technology, programming, or education. ASR often mishears technical English loan-words \
in Vietnamese speech (e.g. "rau fashion" → "arrow function", "hàm a rô" → "arrow function", \
"ri-phắc-tơ" → "refactor", "a-sync" → "async", "e lờ" → "elif", etc.).

Your task:
1. Correct ONLY ASR/spelling mistakes for technical, programming, and educational terms.
2. Preserve the original Vietnamese sentence structures and all factual content EXACTLY.
3. Do NOT add information, do NOT summarize, do NOT rephrase normal sentences.
4. Do NOT remove any content.
5. Return ONLY the corrected plain text with NO commentary, NO markdown.

Transcript:
"""


def normalize_transcript(
    text: str,
    api_key: str,
    model_chain: Optional[List[str]] = None,
) -> str:
    """
    Use Gemini to fix ASR phonetic errors in a Vietnamese technical transcript.

    Only spelling / term corrections are applied — factual content is unchanged.
    Falls back silently to the original text if the LLM call fails.

    Args:
        text: Raw ASR transcript text
        api_key: Gemini API key
        model_chain: Models to try in order (falls back on 429)

    Returns:
        Corrected transcript text (or original on error)
    """
    if not text.strip() or not api_key:
        return text

    if model_chain is None:
        model_chain = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"]

    # Keep the prompt+text within a safe input budget (~12 000 chars)
    budget = 12_000 - len(_NORMALIZE_PROMPT)
    truncated = text[:budget] if len(text) > budget else text

    prompt = _NORMALIZE_PROMPT + truncated

    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=api_key)

        last_err: Exception | None = None
        for model_name in model_chain:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.1,        # low — we want faithful corrections only
                        max_output_tokens=8192,
                    ),
                )
                normalized = (response.text or "").strip()
                if normalized:
                    # If Gemini returned less than 80% of original length something went wrong
                    if len(normalized) < len(truncated) * 0.8:
                        logger.warning(
                            "Transcript normalization result suspiciously short "
                            "(%d vs %d chars) — using original",
                            len(normalized), len(truncated),
                        )
                        return text
                    # Append the un-processed tail (if we truncated)
                    tail = text[budget:] if len(text) > budget else ""
                    result = normalized + (" " + tail if tail else "")
                    logger.info(
                        "Transcript normalized via %s: %d → %d chars",
                        model_name, len(text), len(result),
                    )
                    return result
            except Exception as e:
                err_str = str(e).lower()
                # Daily quota exhausted → skip to next model
                if "429" in err_str and ("daily" in err_str or "per day" in err_str or "quota" in err_str):
                    logger.warning("Normalize: RPD quota on %s, trying next model", model_name)
                    last_err = e
                    continue
                # Per-minute limit → log and skip (not worth waiting for normalization)
                if "429" in err_str:
                    logger.warning("Normalize: RPM limit on %s, skipping normalization", model_name)
                    return text
                logger.warning("Transcript normalization failed on %s: %s — using original", model_name, e)
                last_err = e
                continue

        logger.warning("All models failed for normalization (%s) — using original", last_err)
        return text

    except Exception as e:
        logger.warning("Transcript normalization skipped: %s", e)
        return text
