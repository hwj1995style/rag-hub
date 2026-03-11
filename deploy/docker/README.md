# Docker deployment notes

## Purpose

This directory contains the Docker Compose stack, Nginx config, and env template for `rag-hub`.

Supported environments:

- Linux Docker Engine
- Windows Docker Desktop
- macOS Docker Desktop

## Files

- `docker-compose.yml`
- `.env.example`
- `nginx.conf`

## Services in the stack

- MySQL
- Redis
- MinIO
- Elasticsearch
- Qdrant
- rag-hub-backend
- rag-hub-parser-worker
- nginx

## Quick start

### Prepare env file

```bash
cp deploy/docker/.env.example deploy/docker/.env
```

MySQL uses host port `13306` by default to avoid common host conflicts on `3306`.

### Prepare backend artifact

Compose mounts:

- `backend/target/rag-hub-backend-0.0.1-SNAPSHOT.jar`

### Start the stack

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
```

### Check status

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env ps
```

### Stop the stack

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env down
```

## storage.mode and MinIO integration

Docker now defaults to:

```env
KB_STORAGE_MODE=minio
KB_STORAGE_BUCKET=kb-uploads
```

In this mode:

- the backend persists uploaded source files to MinIO
- `kb_document.source_uri` and `kb_document_version.storage_path` use `minio://...`
- parser-worker downloads source files with `KB_STORAGE_ENDPOINT / KB_STORAGE_ACCESS_KEY / KB_STORAGE_SECRET_KEY / KB_STORAGE_BUCKET`

Default alignment:

- backend: `KB_MINIO_ENDPOINT=http://minio:9000`
- parser-worker: `KB_STORAGE_ENDPOINT=http://minio:9000`
- bucket: `KB_STORAGE_BUCKET=kb-uploads`

For legacy seeded rows that still use `/uploads/...`, parser-worker first tries MinIO and then falls back to local `mock-storage`.

## Auth configuration suggestions

Set these explicitly in real environments:

- `KB_JWT_ISSUER`
- `KB_JWT_SECRET`
- `KB_JWT_EXPIRATION_MINUTES`
- `KB_BOOTSTRAP_ADMIN_ENABLED`

For first-time Docker verification or local demos, bootstrap admin can be enabled temporarily. For longer-lived environments, create a real admin account and turn bootstrap admin back off.