# Test Cases

## Current automated regression baseline

Primary regression mode:
- WSL Playwright
- Docker deployed frontend
- Docker deployed backend
- Docker middleware stack

Run command:
```powershell
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && bash scripts/run_playwright_wsl.sh'
```

Latest verified result:
- `20 passed`

## Covered flows

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
- inline failure states for search, QA, upload, and permission binding
- missing task and missing query log errors
- viewer 403
- invalid token 401 redirect

## Remaining gaps

- Host Linux real-machine regression run
- dependency outage UX beyond mocked API failures
- resource-level authorization after backend implementation