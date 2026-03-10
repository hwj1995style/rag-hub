# Frontend Architecture for rag-hub

## Goal

This document defines the frontend architecture for `rag-hub` in a fully separated frontend-backend model.

It covers:

- frontend responsibilities
- system boundaries
- page information architecture
- technology choices
- auth integration
- state management
- deployment and local integration strategy

## Frontend Role in the System

The backend already owns:

- document ingestion and version APIs
- hybrid retrieval and QA orchestration
- permission binding APIs
- JWT login and role checks

So the frontend should be a separate web app responsible for:

- login
- document management UI
- retrieval and QA workbench
- permission editing UI
- task and log visualization

The frontend maps most closely to the `admin-console` role in the overall implementation plan.

## Boundaries

### Frontend owns

- routing and page rendering
- login state persistence
- API calls and error display
- tables, forms, uploads, result rendering
- role-based UI visibility control

### Backend owns

- all business APIs
- JWT issuance and validation
- admin write authorization
- persistence, retrieval, QA, and logs

### Frontend should not own yet

- resource-level permission enforcement
- parser execution
- retrieval orchestration
- refresh token logic

## Recommended Stack

Use:

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Ant Design

This is the most practical stack for a single developer building a management console against the current API set.

## Suggested Routes

- `/login`
- `/documents`
- `/documents/:documentId`
- `/documents/:documentId/chunks`
- `/search`
- `/qa`
- `/permissions`
- `/tasks/:taskId`
- `/query-logs/:logId`

## Suggested Project Structure

```text
frontend/
  src/
    app/
    router/
    layouts/
    pages/
    features/
    services/
    stores/
    hooks/
    components/
    types/
    utils/
    styles/
```

## Auth Integration

Store at least:

- `accessToken`
- `tokenType`
- `expiresInSeconds`
- `userId`
- `username`
- `displayName`
- `roleCode`

Recommended behavior:

- use `localStorage` for token persistence
- guard all business routes
- on `401`, clear token and redirect to `/login`
- on `403`, show a permission error
- hide admin-only actions for non-admin users

## API Integration

Create a shared `httpClient` that:

- uses `/api` as base path
- injects the Bearer token
- parses `code`, `message`, `traceId`, and `data`
- handles `401` and `403` consistently

Recommended API modules:

- `auth.ts`
- `documents.ts`
- `search.ts`
- `qa.ts`
- `permissions.ts`
- `tasks.ts`
- `queryLogs.ts`

## State Strategy

Use TanStack Query for server state:

- lists
- details
- search results
- QA results
- task details

Use Zustand for local app state:

- auth state
- token
- layout state
- lightweight page UI state

## Local Integration

Recommended ports:

- frontend: `5173`
- backend: `8080`

Use Vite proxy:

- `/api` -> `http://127.0.0.1:8080`
- `/actuator` -> `http://127.0.0.1:8080`

## Deployment Model

Recommended production model:

- build frontend as static assets
- serve frontend through Nginx
- reverse proxy `/api` to `rag-hub-backend`

This keeps frontend and backend physically separated while preserving same-origin browser access.
