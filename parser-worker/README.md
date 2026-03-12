# rag-hub Parser Worker

## Purpose

`parser-worker` is the Python ingestion and indexing worker for `rag-hub`.

It is responsible for:
- polling pending ingest and reparse tasks from MySQL
- downloading source files from MinIO or local fallback storage
- parsing source content into chunks
- writing chunk metadata into MySQL
- writing full-text content into Elasticsearch
- writing vectors into Qdrant
- updating task, parse, and index status

## Deployment modes

Supported modes:
- Docker
- Host Linux

## Primary scripts

- `../scripts/test_parser_worker.ps1`
- `../scripts/package_parser_worker.ps1`

## Recommended workflow

### Docker mode

```powershell
docker compose -f ../deploy/docker/docker-compose.yml --env-file ../deploy/docker/.env.example up -d rag-hub-parser-worker
```

### Host Linux mode

Follow:
- `../docs/knowledge-base-deployment-host-linux.md`

## Tests

```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/test_parser_worker.ps1
```

## Packaging

```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/package_parser_worker.ps1
```

## CI

CI definition:
- `../.github/workflows/ci.yml`