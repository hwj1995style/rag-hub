# Docker Deployment Guide

## Scope

This guide describes the Docker deployment mode for `rag-hub`.

The Docker stack now includes:
- MySQL
- Redis
- MinIO
- Elasticsearch
- Qdrant
- `rag-hub-backend`
- `rag-hub-frontend`
- `rag-hub-parser-worker`
- public `nginx`

## Quick start

Copy the environment file:
```bash
cp deploy/docker/.env.example deploy/docker/.env
```

Start the stack:
```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
```

Check status:
```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env ps
```

Stop the stack:
```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env down
```

## Public endpoints

- Frontend: `http://127.0.0.1/`
- Backend health: `http://127.0.0.1:8080/actuator/health`
- API through nginx: `http://127.0.0.1/api/...`

## Fixed local release commands

Backend only:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_backend_docker.ps1
```

Frontend only:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_frontend_docker.ps1
```

Frontend and backend together:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_dev_stack.ps1
```

Status:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/status_dev_stack.ps1
```

## Frontend container model

The frontend Docker image is built from:
- `deploy/docker/Dockerfile.frontend`
- `deploy/docker/frontend-site.conf`

The public nginx container proxies:
- `/api/*` to `rag-hub-backend`
- `/actuator/health` to `rag-hub-backend`
- `/` to `rag-hub-frontend`

## Storage mode

Docker uses MinIO by default:
```env
KB_STORAGE_MODE=minio
KB_STORAGE_BUCKET=kb-uploads
```

Validated Docker storage loop:
- `upload -> ingest success`
- `reparse -> success`
- `activate -> success`
- `frontend -> nginx -> backend` success

## Verification

The current Docker deployment path has been verified with:
- public frontend `http://127.0.0.1/`
- backend health `http://127.0.0.1:8080/actuator/health`
- WSL Playwright against the Docker deployed frontend
- latest result: `20 passed`