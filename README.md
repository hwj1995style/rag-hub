# rag-hub

rag-hub is a RAG operations platform for document ingestion, search, QA, permission governance, and task operations.

The repository now uses these deployment rules:
- Frontend deployment targets: Docker and Host Linux only
- Backend deployment targets: Docker and Host Linux only
- WSL is kept for tooling only, mainly frontend packaging and Playwright regression runs

## Main directories

- `backend/`: Spring Boot backend API
- `frontend/`: React admin console
- `parser-worker/`: parsing and indexing worker
- `deploy/`: Docker and Host Linux deployment assets
- `scripts/`: packaging, redeploy, smoke-test, and Playwright helpers
- `docs/`: design, development, test, and deployment documents

## Key documents

- `docs/frontend-architecture.md`
- `docs/frontend-development-guide.md`
- `docs/knowledge-base-authentication.md`
- `docs/knowledge-base-api-spec.md`
- `docs/knowledge-base-deployment-docker.md`
- `docs/knowledge-base-deployment-host-linux.md`
- `docs/knowledge-base-document-permission-design.md`
- `docs/knowledge-base-test-cases.md`

## Frontend status

Current frontend stack:
- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Ant Design

Current pages:
- Login
- Documents
- Document detail
- Chunk browser
- Search workbench
- QA workbench
- Permission binding governance
- Task center
- Task detail
- Query logs and detail

## Fixed local release workflow

Use these scripts after code changes.

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

Check stack status:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/status_dev_stack.ps1
```

## Docker deployment

Primary local integration mode:
- Docker frontend
- Docker backend
- Docker middleware components
- WSL Playwright

Start the stack:
```powershell
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env.example up -d
```

Public endpoints:
- Frontend: `http://127.0.0.1/`
- Backend health: `http://127.0.0.1:8080/actuator/health`
- Unified nginx entry: `http://127.0.0.1/`

## Host Linux deployment

Host Linux now includes frontend deployment assets as well:
- `scripts/package_frontend.ps1`
- `deploy/linux/deploy_frontend.sh`
- `deploy/linux/rollback_frontend.sh`
- `deploy/nginx/kb.conf`

Frontend static files are published to `/app/kb/frontend/current` and served by host nginx.

## WSL Playwright workflow

WSL is no longer used to deploy the frontend.
It is still used to:
- keep a Linux Node 24 toolchain
- build frontend artifacts when needed
- run Playwright against Docker or Host Linux deployments

Bootstrap WSL Node 24:
```powershell
wsl -d Ubuntu -- bash /mnt/d/Projects/rag-hub/scripts/bootstrap_playwright_wsl.sh
```

Run Playwright against the Docker deployed frontend:
```powershell
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && bash scripts/run_playwright_wsl.sh'
```

Run Playwright against a Host Linux deployment:
```powershell
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && HOST_BASE_URL=http://<host-linux-ip> bash scripts/run_playwright_wsl_host.sh'
```

## Verified regression coverage

The current WSL Playwright suite covers:
- login
- documents and document detail
- search
- QA
- task center and task detail
- query logs and detail
- upload
- batch import
- reparse
- activate
- permission governance (load, bind, delete single policy)
- failure states for upload/search/QA/permission binding
- missing task and missing query log states
- viewer 403
- invalid token 401 redirect

Latest verified result:
- `25 passed`