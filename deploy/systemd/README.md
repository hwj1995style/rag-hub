# systemd 配置说明

## 1. 作用

本目录保存 Host Linux 部署使用的 `systemd` 服务样例。

## 2. 文件清单

- `rag-hub-backend.service`
- `rag-hub-parser-worker.service`
- `README.md`

## 3. 目标目录结构

```text
/app/kb/
  backend/rag-hub-backend.jar
  parser-worker/
    worker.py
    requirements.txt
    .venv/
  config/kb.env
  logs/
```

## 4. 安装示例

```bash
cp /app/kb/deploy/systemd/rag-hub-backend.service /etc/systemd/system/
cp /app/kb/deploy/systemd/rag-hub-parser-worker.service /etc/systemd/system/
cp /app/kb/deploy/linux/kb.env.template /app/kb/config/kb.env
vi /app/kb/config/kb.env
systemctl daemon-reload
systemctl enable rag-hub-backend.service
systemctl enable rag-hub-parser-worker.service
systemctl start rag-hub-backend.service
systemctl start rag-hub-parser-worker.service
```

## 5. 说明

- `rag-hub-backend.service` 启动 `/app/kb/backend/rag-hub-backend.jar`
- `rag-hub-parser-worker.service` 启动 `/app/kb/parser-worker/.venv/bin/python worker.py`
- 两个服务统一读取 `/app/kb/config/kb.env`
- 环境模板统一来自 `deploy/linux/kb.env.template`
- 日志统一写入 `/app/kb/logs/`
