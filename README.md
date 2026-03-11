# rag-hub

`rag-hub` is a RAG management platform for document ingestion, retrieval, QA orchestration, permissions, and operational workflows. The repository now includes the first separated frontend/backend implementation, plus both host-local and Docker-backed integration paths.

## Main directories

- `backend/`: Spring Boot backend APIs
- `frontend/`: React admin console
- `parser-worker/`: parsing and indexing worker
- `scripts/`: local startup, verification, and reset scripts
- `deploy/`: Docker and Host Linux deployment assets
- `docs/`: design, development, and deployment documents

## Key documents

- Architecture plan: `docs/knowledge-base-implementation-plan.md`
- Backend development: `docs/knowledge-base-development-guide.md`
- Frontend architecture: `docs/frontend-architecture.md`
- Frontend development: `docs/frontend-development-guide.md`
- Authentication: `docs/knowledge-base-authentication.md`
- API spec: `docs/knowledge-base-api-spec.md`
- Docker deployment: `docs/knowledge-base-deployment-docker.md`
- Host Linux deployment: `docs/knowledge-base-deployment-host-linux.md`

## Frontend status

- Stack: `React + TypeScript + Vite + React Router + TanStack Query + Zustand + Ant Design`
- Implemented pages: login, documents, search, QA, task detail, query log detail, permissions
- Vite proxy can switch targets with `VITE_API_PROXY_TARGET` and `VITE_PORT`

## Local integration

### Host-local mode

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run_all_local.ps1 -StartFrontend -SkipWorker -SeedTestData -SkipEnvCheck
powershell -ExecutionPolicy Bypass -File scripts/status_local.ps1 -CheckHealth
powershell -ExecutionPolicy Bypass -File scripts/verify_local_stack.ps1 -FrontendEndpoint http://127.0.0.1:5173 -BackendEndpoint http://127.0.0.1:8080
```

Default endpoints:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:8080`

### Docker-backed mode

```powershell
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
```

Validated Docker-backed endpoints:

- Backend: `http://127.0.0.1:18080`
- Nginx entrypoint: `http://127.0.0.1`
- Example frontend proxy: `http://127.0.0.1:5176` -> `18080`

## storage.mode and MinIO integration

The document source storage now supports two modes:

- `local`: default for host-local development. Uploaded files are written to `KB_STORAGE_UPLOAD_ROOT`, and parser-worker reads them from a shared local directory.
- `minio`: default for Docker integration. The backend uploads source files to MinIO, stores `storage_path` as `minio://<bucket>/<object>`, and parser-worker downloads from MinIO before parsing.

Current Docker defaults:

- `KB_STORAGE_MODE=minio`
- `KB_STORAGE_BUCKET=kb-uploads`
- Backend uses `KB_MINIO_ENDPOINT / KB_MINIO_ACCESS_KEY / KB_MINIO_SECRET_KEY`
- Parser-worker uses `KB_STORAGE_ENDPOINT / KB_STORAGE_ACCESS_KEY / KB_STORAGE_SECRET_KEY / KB_STORAGE_BUCKET`

This flow has been verified end-to-end in Docker:

- `upload -> ingest success`
- `reparse -> success`
- legacy seeded document `/uploads/customer-credit-policy.pdf -> reparse success`
- `nginx -> /api/auth/login`

To switch host-local development back to file sharing explicitly:

```env
KB_STORAGE_MODE=local
KB_STORAGE_UPLOAD_ROOT=parser-worker/mock-storage
```

## Common scripts

```powershell
powershell -ExecutionPolicy Bypass -File scripts/stop_all_local.ps1 -Force
powershell -ExecutionPolicy Bypass -File scripts/reset_local_state.ps1 -StopServices
```

## Authentication and authorization

- `POST /api/auth/login` issues Bearer JWTs
- All APIs except `/api/auth/login`, `/actuator/health`, and `/actuator/info` require login
- Admin write APIs such as upload, batch import, reparse, activate, and permission binding require the `admin` role
- Resource-level authorization rules are still not enforced in retrieval, QA, or document read flows