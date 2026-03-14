"""
Heatmap Service - Extract text block bounding boxes from PDF and map quiz questions to them.

Uses PyMuPDF (fitz) to get per-block bounding boxes, then fuzzy-matches
quiz source keywords to blocks to build a block-level heat map.
"""

import os
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def _normalize(text: str) -> str:
    """Lowercase, collapse whitespace, strip."""
    return re.sub(r"\s+", " ", text.lower().strip())


def extract_pdf_blocks(pdf_path: str) -> list[dict]:
    """
    Extract text blocks with bounding boxes from a PDF using PyMuPDF.

    Returns:
        [
            {
                "page": 1,           # 1-indexed
                "bbox": [x0, y0, x1, y1],
                "text": "...",
                "pageWidth": 612.0,
                "pageHeight": 792.0,
            },
            ...
        ]
    """
    if not os.path.exists(pdf_path):
        return []

    try:
        import fitz
    except ImportError:
        logger.warning("PyMuPDF (fitz) not installed — cannot extract PDF blocks")
        return []

    blocks: list[dict] = []
    try:
        doc = fitz.open(pdf_path)
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_rect = page.rect
            pw, ph = float(page_rect.width), float(page_rect.height)

            raw_blocks = page.get_text("blocks")
            for b in raw_blocks:
                x0, y0, x1, y1 = b[:4]
                text = b[4] if len(b) > 4 else ""
                block_type = b[6] if len(b) > 6 else 0  # 0 = text, 1 = image

                if block_type != 0:
                    continue  # skip image blocks
                text_str = str(text).strip()
                if not text_str or len(text_str) < 3:
                    continue

                blocks.append({
                    "page": page_idx + 1,
                    "bbox": [round(x0, 2), round(y0, 2), round(x1, 2), round(y1, 2)],
                    "text": text_str,
                    "pageWidth": round(pw, 2),
                    "pageHeight": round(ph, 2),
                })
        doc.close()
    except Exception as e:
        logger.error("Failed to extract PDF blocks from %s: %s", pdf_path, e)

    return blocks


def build_heatmap_blocks(
    pdf_path: str,
    questions: list[dict],
    page_offset: int = 0,
) -> list[dict]:
    """
    Build block-level heatmap data by matching quiz questions to PDF text blocks.

    Args:
        pdf_path: path to the PDF file
        questions: list of question dicts with 'sourcePages' and 'sourceKeyword'
        page_offset: offset to add to page numbers (for multi-file quizzes)

    Returns:
        [
            {
                "page": 1,
                "bbox": [x0, y0, x1, y1],
                "count": 3,
                "keywords": ["keyword1", "keyword2"],
                "pageWidth": 612.0,
                "pageHeight": 792.0,
            },
            ...
        ]
    """
    blocks = extract_pdf_blocks(pdf_path)
    if not blocks:
        logger.warning("[heatmap] extract_pdf_blocks returned 0 blocks for %s", pdf_path)
        return []
    logger.info("[heatmap] extracted %d text blocks from %s", len(blocks), os.path.basename(pdf_path))

    # Build keyword → question count mapping
    kw_list: list[str] = []
    for q in questions:
        for kw in (q.get("sourceKeyword") or []):
            k = _normalize(kw)
            if k and len(k) >= 2:
                kw_list.append(k)
    logger.info("[heatmap] %d keywords from %d questions: %s",
                len(kw_list), len(questions), kw_list[:10])

    # Collect source pages from questions (adjusted for offset)
    q_pages: set[int] = set()
    for q in questions:
        for p in (q.get("sourcePages") or []):
            q_pages.add(p)

    # For each block, count how many keywords match
    result: list[dict] = []
    for block in blocks:
        block_page = block["page"] + page_offset
        block_text_norm = _normalize(block["text"])

        matched_keywords: list[str] = []
        for kw in kw_list:
            if kw in block_text_norm:
                matched_keywords.append(kw)

        count = len(matched_keywords)

        # If no keyword matches but the block is on a source page,
        # give it a small heat value based on page-level question count
        if count == 0 and block_page in q_pages:
            # Count questions referencing this page
            page_q_count = sum(
                1 for q in questions
                if block_page in (q.get("sourcePages") or [])
            )
            if page_q_count > 0:
                count = 0  # keep 0 for blocks not matching any keyword on source pages
                # We still skip - only blocks with keyword matches should glow

        if count > 0:
            result.append({
                "page": block_page,
                "bbox": block["bbox"],
                "count": count,
                "keywords": list(set(matched_keywords)),
                "pageWidth": block["pageWidth"],
                "pageHeight": block["pageHeight"],
            })

    # Merge overlapping blocks on the same page
    return result
