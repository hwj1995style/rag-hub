import logging
import time
from pathlib import Path
from parser_worker.config import load_config
from parser_worker.db import Database
from parser_worker.processor import TaskProcessor
from parser_worker.storage.client import StorageClient


def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
    config = load_config('config.yml')
    Path(config.worker.download_dir).mkdir(parents=True, exist_ok=True)
    db = Database(config.database)
    storage = StorageClient(config.storage)
    processor = TaskProcessor(db, storage, config)

    logging.info('parser-worker started')
    while True:
        processed = processor.run_once()
        if processed == 0:
            time.sleep(config.worker.poll_interval_seconds)


if __name__ == '__main__':
    main()
