from pathlib import Path, PurePosixPath
import shutil
from urllib.parse import urlparse
from minio import Minio
from minio.error import S3Error
from parser_worker.config import StorageConfig


class StorageClient:
    def __init__(self, config: StorageConfig):
        self._config = config
        self._minio = None
        if config.mode.lower() == 'minio' and config.endpoint:
            parsed = urlparse(config.endpoint)
            endpoint = parsed.netloc or parsed.path
            secure = parsed.scheme == 'https'
            self._minio = Minio(endpoint, access_key=config.access_key, secret_key=config.secret_key, secure=secure)

    def fetch_to_local(self, source_path: str, download_dir: Path) -> Path:
        download_dir.mkdir(parents=True, exist_ok=True)
        if source_path.startswith('minio://'):
            bucket, object_name = self._parse_minio_uri(source_path)
            return self._fetch_from_minio(bucket, object_name, download_dir)

        if self._config.mode.lower() == 'minio' and self._minio is not None:
            object_name = self._normalize_object_name(source_path)
            try:
                return self._fetch_from_minio(self._config.bucket, object_name, download_dir)
            except FileNotFoundError:
                pass

        source = self._resolve_local_source(source_path)
        if not source.exists():
            raise FileNotFoundError(f'source file not found: {source}')
        target = download_dir / source.name
        shutil.copy2(source, target)
        return target

    def _resolve_local_source(self, source_path: str) -> Path:
        raw_path = Path(source_path)
        if raw_path.exists():
            return raw_path
        normalized = self._normalize_object_name(source_path)
        return self._config.upload_root / Path(*PurePosixPath(normalized).parts)

    def _fetch_from_minio(self, bucket: str, object_name: str, download_dir: Path) -> Path:
        if self._minio is None:
            raise FileNotFoundError(f'source file not found: minio://{bucket}/{object_name}')
        target = download_dir / Path(object_name).name
        try:
            self._minio.fget_object(bucket, object_name, str(target))
            return target
        except S3Error as exc:
            if exc.code in ('NoSuchKey', 'NoSuchBucket', 'NoSuchObject'):
                raise FileNotFoundError(f'source file not found: minio://{bucket}/{object_name}') from exc
            raise

    def _parse_minio_uri(self, source_path: str):
        parsed = urlparse(source_path)
        bucket = parsed.netloc
        object_name = parsed.path.lstrip('/')
        return bucket, object_name

    def _normalize_object_name(self, source_path: str) -> str:
        return source_path.replace('\\', '/').lstrip('/')
