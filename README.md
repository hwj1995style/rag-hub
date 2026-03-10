# rag-hub

`rag-hub` 是一个面向文档接入、混合检索和大模型问答的知识库平台。

## 主要入口

### 开发文档

- 开发指南：`docs/knowledge-base-development-guide.md`
- 前端总体设计：`docs/frontend-architecture.md`
- 前端开发文档：`docs/frontend-development-guide.md`
- 认证说明：`docs/knowledge-base-authentication.md`
- API 规范：`docs/knowledge-base-api-spec.md`
- 实施方案：`docs/knowledge-base-implementation-plan.md`
- DDL 与初始化：`docs/knowledge-base-ddl-and-init.md`
- 测试案例：`docs/knowledge-base-test-cases.md`

### 本地开发与联调

- backend 说明：`backend/README.md`
- parser-worker 说明：`parser-worker/README.md`
- 本地一键验收：`scripts/verify_local_stack.ps1`

### 部署文档

- Docker 部署：`docs/knowledge-base-deployment-docker.md`
- Host Linux 部署：`docs/knowledge-base-deployment-host-linux.md`
- 运维手册：`docs/knowledge-base-ops-handbook.md`
- Docker 目录说明：`deploy/docker/README.md`

## 当前认证状态

后端已实现一版最小可用的认证鉴权能力：

- `POST /api/auth/login` 登录换取 Bearer JWT
- 除 `/api/auth/login`、`/actuator/health`、`/actuator/info` 外，其余接口默认要求认证
- 文档上传、批量导入、重解析、版本激活、权限绑定等管理写接口要求 `admin` 角色
- 资源级权限策略已保留数据模型与管理接口，但尚未接入搜索、问答和文档读取链路

详细说明见：`docs/knowledge-base-authentication.md`

## 部署方式

当前保留两条独立部署路径：

- Host Linux：`systemd + 主机 Nginx + 主机发布脚本`
- Docker：跨平台 `docker compose`

## 关键目录

- `backend/`：Spring Boot 后端服务
- `parser-worker/`：Python 解析与索引 worker
- `scripts/`：本地开发、联调、验收脚本
- `deploy/linux/`：Host Linux 部署脚本
- `deploy/systemd/`：systemd 服务配置
- `deploy/docker/`：Docker 部署文件
- `docs/`：架构、开发、部署、运维文档
