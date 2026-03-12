# Host Linux Deployment Assets

This directory stores the Host Linux deployment scripts and systemd units for `rag-hub`.

Main files:
- `deploy_backend.sh`
- `deploy_parser_worker.sh`
- `deploy_frontend.sh`
- `rollback_backend.sh`
- `rollback_parser_worker.sh`
- `rollback_frontend.sh`
- `verify_deployment.sh`
- `systemd/`

Primary references:
- `../../README.md`
- `../../docs/knowledge-base-deployment-host-linux.md`

Use this directory when you need to:
- deploy or rollback services on Host Linux
- verify a Host Linux environment
- inspect the packaged systemd units