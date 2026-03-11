from dataclasses import dataclass
from pathlib import Path
import os
import re
import yaml

_PATTERN = re.compile(r"\$\{([^:}]+):?([^}]*)\}")


def _resolve(value: str) -> str:
    def repl(match):
        key = match.group(1)
        default = match.group(2)
        return os.getenv(key, default)
    return _PATTERN.sub(repl, value)


def _walk(node):
    if isinstance(node, dict):
        return {k: _walk(v) for k, v in node.items()}
    if isinstance(node, list):
        return [_walk(v) for v in node]
    if isinstance(node, str):
        return _resolve(node)
    return node


@dataclass
class WorkerConfig:
    poll_interval_seconds: int
    batch_size: int
    download_dir: Path
    chunk_size: int
    max_chunk_size: int


@dataclass
class DatabaseConfig:
    host: str
    port: int
    dbname: str
    user: str
    password: str


@dataclass
class StorageConfig:
    mode: str
    upload_root: Path
    endpoint: str
    access_key: str
    secret_key: str
    bucket: str


@dataclass
class SearchConfig:
    enabled: bool
    endpoint: str
    index_name: str
    timeout_seconds: int


@dataclass
class VectorConfig:
    enabled: bool
    endpoint: str
    collection_name: str
    embedding_model: str
    embedding_dim: int
    timeout_seconds: int


@dataclass
class AppConfig:
    worker: WorkerConfig
    database: DatabaseConfig
    storage: StorageConfig
    search: SearchConfig
    vector: VectorConfig


def load_config(path: str) -> AppConfig:
    with open(path, 'r', encoding='utf-8') as f:
        raw = yaml.safe_load(f)
    data = _walk(raw)
    return AppConfig(
        worker=WorkerConfig(
            poll_interval_seconds=int(data['worker']['poll_interval_seconds']),
            batch_size=int(data['worker']['batch_size']),
            download_dir=Path(data['worker']['download_dir']),
            chunk_size=int(data['worker']['chunk_size']),
            max_chunk_size=int(data['worker']['max_chunk_size']),
        ),
        database=DatabaseConfig(
            host=data['database']['host'],
            port=int(data['database']['port']),
            dbname=data['database']['dbname'],
            user=data['database']['user'],
            password=data['database']['password'],
        ),
        storage=StorageConfig(
            mode=data['storage']['mode'],
            upload_root=Path(data['storage']['upload_root']),
            endpoint=data['storage'].get('endpoint', ''),
            access_key=data['storage'].get('access_key', ''),
            secret_key=data['storage'].get('secret_key', ''),
            bucket=data['storage'].get('bucket', 'kb-uploads'),
        ),
        search=SearchConfig(
            enabled=str(data['search']['enabled']).lower() == 'true',
            endpoint=data['search']['endpoint'].rstrip('/'),
            index_name=data['search']['index_name'],
            timeout_seconds=int(data['search']['timeout_seconds']),
        ),
        vector=VectorConfig(
            enabled=str(data['vector']['enabled']).lower() == 'true',
            endpoint=data['vector']['endpoint'].rstrip('/'),
            collection_name=data['vector']['collection_name'],
            embedding_model=data['vector']['embedding_model'],
            embedding_dim=int(data['vector']['embedding_dim']),
            timeout_seconds=int(data['vector']['timeout_seconds']),
        ),
    )
