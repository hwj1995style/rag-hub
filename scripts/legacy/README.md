# Legacy Candidate Notes

This directory is reserved for scripts that may be archived later.

Current status:
- active workflow scripts stay in `scripts/`
- primary docs and CI no longer reference most legacy candidates
- one helper chain still remains inside the candidate set itself

## Safe to keep in scripts/

These are still part of the supported workflow or directly referenced by CI and primary docs:
- `package_backend.ps1`
- `package_frontend.ps1`
- `package_frontend_wsl.sh`
- `package_parser_worker.ps1`
- `redeploy_backend_docker.ps1`
- `redeploy_frontend_docker.ps1`
- `redeploy_dev_stack.ps1`
- `status_dev_stack.ps1`
- `bootstrap_playwright_wsl.sh`
- `run_playwright_wsl.sh`
- `run_playwright_wsl_host.sh`
- `check_host_linux_backend.ps1`
- `test_backend.ps1`
- `test_parser_worker.ps1`

## Ready-to-archive candidates

These are no longer part of the primary release flow and no longer have live references in main docs or CI:

### Group A: backend environment diagnostics
- `init_backend_env.ps1`

Reason:
- useful as an occasional manual helper
- not part of Docker or Host Linux release flow

### Group C: backend-only API verification helpers
- `api_smoke_test.ps1`
- `api_assert_test.ps1`

Reason:
- still useful for targeted diagnostics
- overlapped by Playwright and stack-level checks for the normal workflow

## Keep-together candidates

These are still good archive candidates, but they should move together because one script calls another:

### Group B: sample-data rebuild helpers
- `init_db.sh`
- `init_search_stack.ps1`
- `reindex_sample_data.ps1`

Reason:
- useful for rebuilding demo or sample data
- not part of the standard redeploy path

Remaining blocker:
- `reindex_sample_data.ps1` still depends on `init_search_stack.ps1`

Related note:
- `docs/knowledge-base-ddl-and-init.md` still documents the `scripts/init/` SQL assets, which is fine
- that document is not a blocker for archiving the helper wrappers above

## Suggested move order

When we are ready to archive scripts for real, the safest order is:
1. move group A and group C into `scripts/legacy/`
2. move group B together in the same change
3. leave a short forwarding note in this file if we want the history to stay discoverable
