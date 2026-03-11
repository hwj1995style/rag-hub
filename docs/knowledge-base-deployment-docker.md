# rag-hub Docker deployment guide

## Scope

This guide covers Docker / Docker Compose deployment for `rag-hub` on:

- Linux Docker Engine
- Windows Docker Desktop
- macOS Docker Desktop

## Fastest first-time setup

### Prepare env file

```bash
cp deploy/docker/.env.example deploy/docker/.env
```

The default host mapping is `13306 -> 3306` for MySQL to avoid common local conflicts.

### Prepare backend artifact

Required file:

- `backend/target/rag-hub-backend-0.0.1-SNAPSHOT.jar`

### Start containers

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
```

### Check status

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env ps
```

### Stop containers

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env down
```

## Authentication config

Recommended explicit settings:

```env
KB_JWT_ISSUER=rag-hub
KB_JWT_SECRET=replace-with-a-strong-secret
KB_JWT_EXPIRATION_MINUTES=120
KB_BOOTSTRAP_ADMIN_ENABLED=false
```

For first-time verification, bootstrap admin can be enabled temporarily and then disabled after setup.

## Startup ordering

Compose already enforces this health chain:

- `mysql healthy -> rag-hub-backend`
- `mysql healthy -> rag-hub-parser-worker`
- `rag-hub-backend healthy -> nginx`

## storage.mode and MinIO integration

### Default Docker storage mode

Docker now defaults to:

```env
KB_STORAGE_MODE=minio
KB_STORAGE_BUCKET=kb-uploads
```

This means:

- backend uploads persist the real source file into MinIO
- `storage_path` is stored as `minio://kb-uploads/...`
- parser-worker downloads from MinIO before chunking and indexing

### Important variables

Backend side:

```env
KB_MINIO_ENDPOINT=http://minio:9000
KB_MINIO_ACCESS_KEY=minioadmin
KB_MINIO_SECRET_KEY=minioadmin123
KB_STORAGE_MODE=minio
KB_STORAGE_BUCKET=kb-uploads
```

Parser-worker side:

```env
KB_STORAGE_ENDPOINT=http://minio:9000
KB_STORAGE_ACCESS_KEY=minioadmin
KB_STORAGE_SECRET_KEY=minioadmin123
KB_STORAGE_BUCKET=kb-uploads
KB_STORAGE_MODE=minio
```

### Legacy path compatibility

For existing seeded rows, worker still supports fallback behavior:

- if `storage_path` is the older `/uploads/...`
- worker tries MinIO resolution first
- if that is not applicable, it falls back to local `mock-storage`

### Verified results

The following were verified successfully in Docker:

- new uploaded document: `upload -> ingest success`
- new uploaded document: `reparse -> success`
- seeded document `/uploads/customer-credit-policy.pdf -> reparse success`
- Nginx unified entrypoint: `nginx -> /api/auth/login`

## Troubleshooting

If upload or reparse still fails in Docker, check these first:

1. `rag-hub-backend` is running with `KB_STORAGE_MODE=minio`
2. `rag-hub-parser-worker` has `KB_STORAGE_ENDPOINT / ACCESS_KEY / SECRET_KEY / BUCKET`
3. MinIO is healthy and reachable at `http://127.0.0.1:9000`
4. `docker logs rag-hub-parser-worker` no longer shows `source file not found`

If you intentionally want local shared files instead of MinIO, align both sides with:

```env
KB_STORAGE_MODE=local
KB_STORAGE_UPLOAD_ROOT=./mock-storage
```