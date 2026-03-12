# Host Linux Deployment Guide

## Scope

This guide describes the Host Linux deployment mode.

Host Linux now includes these frontend assets as well:
- `scripts/package_frontend.ps1`
- `deploy/linux/deploy_frontend.sh`
- `deploy/linux/rollback_frontend.sh`
- `deploy/nginx/kb.conf`

## Recommended layout

- `/app/kb/backend`
- `/app/kb/parser-worker`
- `/app/kb/frontend/current`
- `/app/kb/config`
- `/app/kb/logs`
- `/app/kb/packages`
- `/app/kb/backups`

## Recommended deployment order

Environment preflight:
```bash
bash deploy/linux/preflight_check.sh
```

Install runtime:
```bash
sudo bash deploy/linux/install_runtime.sh
```

Prepare env file:
```bash
mkdir -p /app/kb/config
cp deploy/linux/kb.env.template /app/kb/config/kb.env
vi /app/kb/config/kb.env
```

Deploy backend:
```bash
sudo /app/kb/deploy/linux/deploy_backend.sh
```

Deploy parser worker:
```bash
sudo /app/kb/deploy/linux/deploy_parser_worker.sh
```

Deploy frontend:
```bash
sudo /app/kb/deploy/linux/deploy_frontend.sh
```

Verify deployment:
```bash
/app/kb/deploy/linux/verify_deployment.sh
```

## Frontend packaging flow

Create the frontend package on the development machine:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/package_frontend.ps1
```

Artifact output:
- `dist/frontend/rag-hub-frontend-dist.tar.gz`

Publish the artifact to the Host Linux package directory, then run `deploy_frontend.sh`.

## Host nginx role

`deploy/nginx/kb.conf` now serves frontend static files from:
- `/app/kb/frontend/current`

and proxies:
- `/api/*` to `127.0.0.1:8080`
- `/actuator/health` to `127.0.0.1:8080`

## Rollback

Backend rollback:
```bash
sudo /app/kb/deploy/linux/rollback_backend.sh
```

Parser worker rollback:
```bash
sudo /app/kb/deploy/linux/rollback_parser_worker.sh
```

Frontend rollback:
```bash
sudo /app/kb/deploy/linux/rollback_frontend.sh
```