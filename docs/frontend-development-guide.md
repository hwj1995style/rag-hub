# Frontend Development Guide for rag-hub

## Goal

This guide breaks the frontend implementation into practical phases so it can be delivered incrementally and validated against the current backend.

## Phase 1 Goal

The first frontend delivery should make the system usable for login, document browsing, search, and QA.

Minimum goals:

- login works
- document list and detail work
- chunk view works
- search works
- QA works
- admin-only operations are visible only to admin users

## Project Initialization

Create a new project under:

- `frontend/`

Suggested bootstrap command:

```bash
npm create vite@latest frontend -- --template react-ts
```

Recommended dependencies:

```bash
react-router-dom
@tanstack/react-query
zustand
axios
antd
@ant-design/icons
```

## Suggested Development Phases

### Phase 1: Project Skeleton

Build:

- Vite + React + TypeScript app
- router
- query provider
- Ant Design setup
- base layout
- `httpClient`
- local env and proxy config

### Phase 2: Authentication Flow

Build:

- login page
- `/api/auth/login` integration
- token persistence
- route guard
- logout
- automatic `401` handling

### Phase 3: Document Center

Build:

- document list page
- document detail page
- chunk view page or drawer

Integrate first:

- `GET /api/documents`
- `GET /api/documents/{documentId}`
- `GET /api/documents/{documentId}/chunks`

Then add admin actions:

- upload
- batch import
- reparse
- activate version

### Phase 4: Search Workbench

Build:

- query input area
- optional filters
- result list with title, locator, score, and snippet

Integrate:

- `POST /api/search/query`

### Phase 5: QA Workbench

Build:

- question input
- answer panel
- citations panel
- optional topK and sessionId controls
- query-log detail link

Integrate:

- `POST /api/qa/query`
- `GET /api/query-logs/{logId}`

### Phase 6: Permissions and Tasks

Build:

- permission binding page
- task detail page

Integrate:

- `POST /api/permissions/bind`
- `GET /api/tasks/{taskId}`

## Recommended Build Order

1. login page
2. main layout
3. document list
4. document detail
5. chunk view
6. search page
7. QA page
8. permissions page
9. task page

## API Handling Rules

- do not call `axios` directly inside pages
- centralize response parsing
- treat non-`KB-00000` as business errors
- inject Bearer token automatically

Recommended query keys:

- `['documents', filters]`
- `['document', documentId]`
- `['documentChunks', documentId, params]`
- `['search', request]`
- `['qa', request]`
- `['task', taskId]`
- `['queryLog', logId]`

## Local Integration Plan

Recommended local ports:

- frontend: `5173`
- backend: `8080`

Recommended Vite proxy:

- `/api` -> backend
- `/actuator` -> backend

Suggested integration order:

1. login
2. document list
3. document detail and chunks
4. search
5. QA
6. admin write APIs

## Acceptance Checklist

- login success and failure both behave correctly
- refresh preserves login state
- `401` redirects to login
- `403` shows a permission message
- documents can be listed and opened
- chunks can be viewed
- search results render correctly
- QA answers and citations render correctly
- admin and non-admin users see different action buttons

## Known Limits

At the moment, the backend does not enforce resource-level policies on search, QA, or document reads. The frontend must not assume those rules are already active.

The frontend can only provide:

- login-state control
- role-based UI visibility control
