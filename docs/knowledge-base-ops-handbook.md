# Operations Handbook

## Scope

This handbook is the operations entry point for `rag-hub`.

Supported deployment modes:
- Docker
- Host Linux

## Primary deployment references

- `./knowledge-base-deployment-docker.md`
- `./knowledge-base-deployment-host-linux.md`

## Recommended release flow

### Docker

Backend only:
```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/redeploy_backend_docker.ps1
```

Frontend only:
```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/redeploy_frontend_docker.ps1
```

Frontend and backend together:
```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/redeploy_dev_stack.ps1
```

Status:
```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/status_dev_stack.ps1
```

### Host Linux

Deploy:
```bash
/app/kb/deploy/linux/deploy_backend.sh
/app/kb/deploy/linux/deploy_parser_worker.sh
/app/kb/deploy/linux/deploy_frontend.sh
```

Rollback:
```bash
/app/kb/deploy/linux/rollback_backend.sh
/app/kb/deploy/linux/rollback_parser_worker.sh
/app/kb/deploy/linux/rollback_frontend.sh
```

Verify:
```bash
/app/kb/deploy/linux/verify_deployment.sh
```

## Release checklist

Check at least these items:
- frontend entry is reachable
- backend health returns `UP`
- core search and QA paths are reachable
- MySQL, Redis, MinIO, Elasticsearch, and Qdrant are reachable
- parser-worker is running when enabled

## Notes

The older one-off backend API helper scripts are no longer part of the primary release handbook.
If they are still needed later, they can be moved into `scripts/legacy/` after final cleanup.