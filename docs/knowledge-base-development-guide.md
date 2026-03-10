# rag-hub 开发指南

## 1. 文档目标

本文档用于指导 `rag-hub` 的日常研发与落地推进。

关联文档：

- `docs/knowledge-base-implementation-plan.md`
- `docs/frontend-architecture.md`
- `docs/frontend-development-guide.md`
- `docs/knowledge-base-authentication.md`
- `docs/knowledge-base-api-spec.md`
- `docs/knowledge-base-deployment-docker.md`

## 2. 一期范围

一期聚焦文档型知识库，覆盖：

- PDF、Word、Excel、PPT、Markdown 接入
- 解析、分块、索引
- MySQL 元数据存储
- Elasticsearch 全文检索
- Qdrant 向量检索
- 引用式问答
- 版本管理和基础权限

## 3. 服务分层

### backend

负责：

- 文档 API
- 检索 API
- 问答 API
- 任务和 query log API
- 登录、JWT 与基础角色鉴权

### parser-worker

负责：

- 认领 ingest 任务
- 解析文件并生成 chunk
- 写入 MySQL、Elasticsearch、Qdrant
- 回写 parse/index 状态

### frontend

规划为独立 Web 工程，负责：

- 登录
- 文档管理 UI
- 检索与问答工作台
- 权限管理页
- 任务与日志查看

## 4. 建议开发顺序

1. 保持 backend API 和认证能力稳定
2. 初始化 `frontend/` 独立工程
3. 打通登录、文档、检索、问答主链路
4. 补充权限绑定、任务查看和 query log 页
5. 完成前端打包与 Nginx 集成部署
