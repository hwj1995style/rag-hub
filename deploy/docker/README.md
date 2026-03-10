# Docker Deployment Notes

## Purpose

This directory contains the cross-platform Docker deployment files for `rag-hub`.

Supported environments:

- Linux Docker Engine
- macOS Docker Desktop
- Windows Docker Desktop

## Files

- `docker-compose.yml`
- `.env.example`
- `nginx.conf`

## Services

The current compose stack includes:

- MySQL
- Redis
- MinIO
- Elasticsearch
- Qdrant
- rag-hub-backend
- rag-hub-parser-worker
- nginx

## Quick Start

### Prepare env file

```bash
cp deploy/docker/.env.example deploy/docker/.env
```

Adjust ports, passwords, and feature flags as needed. The default host MySQL port is `13306`.

### Prepare backend artifact

Compose expects:

- `backend/target/rag-hub-backend-0.0.1-SNAPSHOT.jar`

### Start services

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
```

### Check status

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env ps
```

### Stop services

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env down
```

## Auth Variables

Recommended variables:

- `KB_JWT_ISSUER`
- `KB_JWT_SECRET`
- `KB_JWT_EXPIRATION_MINUTES`
- `KB_BOOTSTRAP_ADMIN_ENABLED`

Docker defaults to `KB_BOOTSTRAP_ADMIN_ENABLED=false`. For long-running environments, prefer a pre-created admin account over bootstrap admin.
