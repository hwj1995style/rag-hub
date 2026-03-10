# rag-hub Docker Deployment

## Scope

This guide covers Docker and Docker Compose deployment for `rag-hub` on:

- Linux Docker Engine
- Windows Docker Desktop
- macOS Docker Desktop

## Quick Start

### Prepare env file

```bash
cp deploy/docker/.env.example deploy/docker/.env
```

The default host MySQL port mapping is `13306 -> 3306` to avoid host-side conflicts.

### Prepare backend artifact

Required file:

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

## Auth Settings

Recommended environment variables:

```env
KB_JWT_ISSUER=rag-hub
KB_JWT_SECRET=replace-with-a-strong-secret
KB_JWT_EXPIRATION_MINUTES=120
KB_BOOTSTRAP_ADMIN_ENABLED=false
```

If you need a one-time bootstrap admin, enable it temporarily and disable it again after initialization.

## Startup Ordering

Compose already enforces this dependency chain:

- `mysql healthy -> rag-hub-backend`
- `mysql healthy -> rag-hub-parser-worker`
- `rag-hub-backend healthy -> nginx`
