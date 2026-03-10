# rag-hub Development Guide

## Goal

This guide explains how the current `rag-hub` project is intended to evolve in development.

Related docs:

- `docs/knowledge-base-implementation-plan.md`
- `docs/frontend-architecture.md`
- `docs/frontend-development-guide.md`
- `docs/knowledge-base-authentication.md`
- `docs/knowledge-base-api-spec.md`
- `docs/knowledge-base-deployment-docker.md`

## Phase-1 Scope

Phase 1 focuses on a document-centric knowledge hub with:

- PDF, Word, Excel, PPT, and Markdown ingestion
- parsing and chunking
- metadata storage in MySQL
- full-text search in Elasticsearch
- vector search in Qdrant
- retrieval-augmented QA with citations
- version management and basic permissions

## Current Service Split

### backend

Responsible for:

- document APIs
- search APIs
- QA APIs
- task and query-log APIs
- login, JWT, and basic role checks

### parser-worker

Responsible for:

- claiming ingest tasks
- parsing files and generating chunks
- writing to MySQL, Elasticsearch, and Qdrant
- updating parse and index status

### frontend

Planned as a separate web project for:

- login
- document management UI
- search and QA workbench
- permissions UI
- task and log views

## Recommended Development Order

1. keep backend API and auth stable
2. initialize the separate `frontend/` project
3. implement login, documents, search, and QA flows
4. add permissions, tasks, and query-log views
5. integrate frontend build output into the Nginx deployment path
