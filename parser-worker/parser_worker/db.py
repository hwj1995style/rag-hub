from contextlib import contextmanager
import pymysql
from parser_worker.config import DatabaseConfig


class Database:
    def __init__(self, config: DatabaseConfig):
        self._config = config

    @contextmanager
    def connection(self):
        conn = pymysql.connect(
            host=self._config.host,
            port=self._config.port,
            database=self._config.dbname,
            user=self._config.user,
            password=self._config.password,
            autocommit=False,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.Cursor,
        )
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()