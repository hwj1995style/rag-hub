# rag-hub

`rag-hub` is a knowledge hub platform for document ingestion, hybrid retrieval, and citation-based LLM question answering.

## Entry Points

### Development Docs

- Development guide: `docs/knowledge-base-development-guide.md`
- Frontend architecture: `docs/frontend-architecture.md`
- Frontend development guide: `docs/frontend-development-guide.md`
- Authentication guide: `docs/knowledge-base-authentication.md`
- API spec: `docs/knowledge-base-api-spec.md`
- Implementation plan: `docs/knowledge-base-implementation-plan.md`
- DDL and init: `docs/knowledge-base-ddl-and-init.md`
- Test cases: `docs/knowledge-base-test-cases.md`

### Local Development

- Backend notes: `backend/README.md`
- Parser worker notes: `parser-worker/README.md`
- One-click local verification: `scripts/verify_local_stack.ps1`

### Deployment Docs

- Docker deployment: `docs/knowledge-base-deployment-docker.md`
- Host Linux deployment: `docs/knowledge-base-deployment-host-linux.md`
- Ops handbook: `docs/knowledge-base-ops-handbook.md`
- Docker directory notes: `deploy/docker/README.md`

## Current Authentication Status

The backend already supports a minimal but usable authentication and authorization flow:

- `POST /api/auth/login` issues a Bearer JWT
- All business APIs require authentication except `/api/auth/login`, `/actuator/health`, and `/actuator/info`
- Admin write operations require the `admin` role
- Resource-level policy storage exists, but resource-level filtering is not wired into search, QA, or document reads yet

See `docs/knowledge-base-authentication.md` for details.

## Deployment Options

Two independent deployment paths are currently supported:

- Host Linux: `systemd + host Nginx + host deployment scripts`
- Docker: cross-platform `docker compose`

## Key Directories

- `backend/`: Spring Boot backend service
- `parser-worker/`: Python parser and indexing worker
- `scripts/`: local development, integration, and verification scripts
- `deploy/linux/`: Host Linux deployment scripts
- `deploy/systemd/`: systemd service files
- `deploy/docker/`: Docker deployment files
- `docs/`: architecture, development, deployment, and ops docs
