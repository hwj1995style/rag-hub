# Frontend Development Guide

## Goal

This guide defines the current frontend development and integration workflow for `frontend/`.

The important rule is:
- frontend deployment targets are Docker and Host Linux
- WSL is kept only for frontend packaging support and Playwright regression runs

## Current implementation scope

Implemented pages:
- login
- documents
- document detail
- chunks
- search
- QA
- permission binding
- task center
- task detail
- query log detail

Implemented management actions:
- upload
- batch import
- reparse
- activate
- permission binding

## Frontend project structure

```text
frontend/
  src/
    components/
    layouts/
    pages/
    router/
    services/
      api/
      http/
    stores/
    types/
    utils/
```

## Local integration workflow

### Primary local mode

The default local mode is now:
- Docker frontend
- Docker backend
- Docker middleware services
- WSL Playwright

### Fixed release scripts

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

Status check:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/status_dev_stack.ps1
```

### Notes

- `redeploy_backend_docker.ps1` packages the backend jar and rebuilds the Docker backend image.
- `redeploy_frontend_docker.ps1` builds frontend static assets through the WSL toolchain, rebuilds the Docker frontend image, and force-recreates the public nginx entry.
- `redeploy_dev_stack.ps1` combines both flows.
- `status_dev_stack.ps1` checks Docker services, public frontend entry, and backend health.

## Host Linux integration workflow

Host Linux now includes frontend deployment assets.

Pre-check backend:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/check_host_linux_backend.ps1 -BackendEndpoint http://<host-linux-ip>:8080 -Username <admin-user> -Password <admin-password>
```

Run Playwright against the Host Linux deployment:
```powershell
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && HOST_BASE_URL=http://<host-linux-ip> bash scripts/run_playwright_wsl_host.sh'
```

## WSL tooling workflow

WSL is still required for:
- Linux Node 24 bootstrap
- frontend packaging helper scripts
- Playwright browser regression runs

Bootstrap command:
```powershell
wsl -d Ubuntu -- bash /mnt/d/Projects/rag-hub/scripts/bootstrap_playwright_wsl.sh
```

Run Playwright against Docker frontend:
```powershell
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && bash scripts/run_playwright_wsl.sh'
```

## Current regression result

Latest verified result:
- `20 passed`

Covered flows:
- login
- documents and document detail
- search
- QA
- task center and task detail
- query log detail
- upload
- batch import
- reparse
- activate
- permission binding
- major inline failure states
- viewer 403
- invalid token 401 redirect