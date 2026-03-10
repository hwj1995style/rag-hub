from __future__ import annotations

from pathlib import Path
from typing import List

from parser_worker.models import ChunkRecord


def split_text(text: str, chunk_size: int, max_chunk_size: int) -> List[ChunkRecord]:
    cleaned = '\n'.join(line.strip() for line in text.splitlines() if line.strip())
    if not cleaned:
        return []

    paragraphs = [p.strip() for p in cleaned.split('\n') if p.strip()]
    chunks: List[ChunkRecord] = []
    buffer = []
    current_len = 0
    chunk_no = 1

    for paragraph in paragraphs:
        length = len(paragraph)
        if current_len and current_len + length > max_chunk_size:
            content = '\n'.join(buffer)
            chunks.append(_build_chunk(chunk_no, content))
            chunk_no += 1
            buffer = []
            current_len = 0
        buffer.append(paragraph)
        current_len += length
        if current_len >= chunk_size:
            content = '\n'.join(buffer)
            chunks.append(_build_chunk(chunk_no, content))
            chunk_no += 1
            buffer = []
            current_len = 0

    if buffer:
        chunks.append(_build_chunk(chunk_no, '\n'.join(buffer)))
    return chunks


def _build_chunk(chunk_no: int, content: str) -> ChunkRecord:
    summary = content[:80]
    return ChunkRecord(
        chunk_no=chunk_no,
        chunk_type='paragraph',
        title_path='自动分块',
        page_no=None,
        locator=f'chunk-{chunk_no}',
        content_text=content,
        content_summary=summary,
        token_count=len(content),
        char_count=len(content),
    )
