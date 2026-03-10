from pathlib import Path
import shutil
from parser_worker.config import StorageConfig


class StorageClient:
    def __init__(self, config: StorageConfig):
        self._config = config

    def fetch_to_local(self, source_path: str, download_dir: Path) -> Path:
        download_dir.mkdir(parents=True, exist_ok=True)
        source = Path(source_path)
        if not source.is_absolute():
            source = self._config.upload_root / source_path.lstrip('/').replace('/', '\\')
        if not source.exists():
            raise FileNotFoundError(f'source file not found: {source}')
        target = download_dir / source.name
        shutil.copy2(source, target)
        return target
