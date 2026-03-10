# rag-hub API Specification

## Goal

This document describes the current core API contract for `rag-hub`, including:

- endpoints
- request and response conventions
- auth rules
- role requirements
- common error codes

## Common Response Shape

```json
{
  "code": "KB-00000",
  "message": "success",
  "traceId": "uuid",
  "data": {}
}
```

## Common Error Codes

- `KB-40001`: bad request
- `KB-40101`: authentication required
- `KB-40102`: invalid username or password
- `KB-40301`: permission denied
- `KB-50006`: internal server error

## Auth Model

### Login

`POST /api/auth/login`

Request:

```json
{
  "username": "admin",
  "password": "ChangeMe123!"
}
```

Response `data`:

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

### Bearer Token

```http
Authorization: Bearer <jwt>
```

Public endpoints:

- `POST /api/auth/login`
- `GET /actuator/health`
- `GET /actuator/info`

All business APIs require authentication.

### Role Rules

Admin-only write APIs:

- `POST /api/documents/upload`
- `POST /api/documents/batch-import`
- `POST /api/documents/{documentId}/reparse`
- `POST /api/documents/{documentId}/versions/{versionId}/activate`
- `POST /api/permissions/bind`

Authenticated-user APIs:

- document list and detail APIs
- chunk APIs
- task APIs
- search APIs
- QA APIs
- query log APIs

Resource-level policy enforcement is not active yet.
