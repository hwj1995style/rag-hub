# rag-hub Authentication and Authorization

## Scope

The backend currently provides a minimal but usable auth layer with:

- Spring Security integration
- username/password login
- Bearer JWT issuance and validation
- global authentication enforcement
- role-based protection for admin write APIs

Not implemented yet:

- resource-level filtering for document reads, search, and QA
- refresh token
- logout blacklist
- multi-session management

## Login API

Endpoint: `POST /api/auth/login`

Request:

```json
{
  "username": "admin",
  "password": "ChangeMe123!"
}
```

Successful `data` payload:

```json
{
  "tokenType": "Bearer",
  "accessToken": "<jwt>",
  "expiresInSeconds": 7200,
  "user": {
    "userId": "uuid",
    "username": "admin",
    "displayName": "Local Admin",
    "roleCode": "admin"
  }
}
```

## Token Usage

Send the token in the request header:

```http
Authorization: Bearer <jwt>
```

Public endpoints:

- `POST /api/auth/login`
- `GET /actuator/health`
- `GET /actuator/info`
- `/h2-console/**` for local development only

All other `/api/**` endpoints require authentication.

## Current Role Rules

Admin-only endpoints:

- `POST /api/documents/upload`
- `POST /api/documents/batch-import`
- `POST /api/documents/{documentId}/reparse`
- `POST /api/documents/{documentId}/versions/{versionId}/activate`
- `POST /api/permissions/bind`

Authenticated-user endpoints:

- `GET /api/documents`
- `GET /api/documents/{documentId}`
- `GET /api/documents/{documentId}/chunks`
- `GET /api/tasks/{taskId}`
- `POST /api/search/query`
- `POST /api/qa/query`
- `GET /api/query-logs/{logId}`

## Config Keys

Prefix: `kb.security`

JWT config:

- `kb.security.jwt.issuer`
- `kb.security.jwt.secret`
- `kb.security.jwt.expiration-minutes`

Bootstrap admin config:

- `kb.security.bootstrap-admin.enabled`
- `kb.security.bootstrap-admin.username`
- `kb.security.bootstrap-admin.password`
- `kb.security.bootstrap-admin.display-name`
- `kb.security.bootstrap-admin.role-code`

The local default profile enables bootstrap admin. The `prod` and `docker` profiles disable it by default.
