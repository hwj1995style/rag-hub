from dataclasses import dataclass
from typing import Optional


@dataclass
class IngestTask:
    id: str
    task_type: str
    source_uri: Optional[str]
    document_id: Optional[str]
    version_id: Optional[str]
    status: str
    step: Optional[str]


@dataclass
class DocumentVersion:
    document_id: str
    version_id: str
    title: str
    source_type: str
    source_uri: Optional[str]
    storage_path: str
    file_name: str


@dataclass
class ChunkRecord:
    chunk_no: int
    chunk_type: str
    title_path: str
    page_no: Optional[int]
    locator: str
    content_text: str
    content_summary: str
    token_count: int
    char_count: int


@dataclass
class PersistedChunk:
    chunk_id: str
    document_id: str
    version_id: str
    chunk_no: int
    chunk_type: str
    title_path: str
    page_no: Optional[int]
    locator: str
    content_text: str
    content_summary: str
    token_count: int
    char_count: int


@dataclass
class PersistedVectorRef:
    chunk_id: str
    collection_name: str
    point_id: str
    embedding_model: str
    embedding_dim: int