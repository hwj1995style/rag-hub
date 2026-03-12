# rag-hub Backend

## Purpose

The backend is the Spring Boot API service for `rag-hub`.

It currently owns:
- document management APIs
- search APIs
- QA APIs
- task APIs
- query log APIs
- permission binding APIs
- JWT authentication and role-based authorization

## Runtime modes

Supported deployment modes:
- Docker
- Host Linux

The repository no longer treats direct Windows host backend startup as a supported runtime mode.

## Local tooling

Bundled local tools:
- `../tools/jdk-17.0.14+7`
- `../tools/apache-maven-3.9.13`

Primary scripts:
- `../scripts/test_backend.ps1`
- `../scripts/package_backend.ps1`
- `../scripts/redeploy_backend_docker.ps1`
- `../scripts/status_dev_stack.ps1`

## Recommended workflow

### Docker mode

Redeploy backend only:
```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/redeploy_backend_docker.ps1
```

Check stack status:
```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/status_dev_stack.ps1
```

### Host Linux mode

Follow:
- `../docs/knowledge-base-deployment-host-linux.md`

Then verify with:
```bash
/app/kb/deploy/linux/verify_deployment.sh
```

## Tests

```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/test_backend.ps1 -Clean -MavenGoal test
```

## Health endpoint

- `GET /actuator/health`

## CI

CI definition:
- `../.github/workflows/ci.yml`