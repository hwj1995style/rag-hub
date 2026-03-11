# rag-hub

`rag-hub` 是一个面向文档接入、检索问答、权限治理和任务运营的 RAG 管理平台。当前仓库已经完成前后端分离的一期实现，并同时保留宿主机联调与 Docker 联调两套开发路径。

## 主要目录

- `backend/`：Spring Boot 后端 API
- `frontend/`：React 前端控制台
- `parser-worker/`：解析与索引 worker
- `scripts/`：本地启动、校验、重置脚本
- `deploy/`：Docker 与 Host Linux 部署资产
- `docs/`：设计、开发、部署文档

## 关键文档

- 总体设计：`docs/knowledge-base-implementation-plan.md`
- 后端开发：`docs/knowledge-base-development-guide.md`
- 前端设计：`docs/frontend-architecture.md`
- 前端开发：`docs/frontend-development-guide.md`
- 认证鉴权：`docs/knowledge-base-authentication.md`
- API 规范：`docs/knowledge-base-api-spec.md`
- Docker 部署：`docs/knowledge-base-deployment-docker.md`
- Host Linux 部署：`docs/knowledge-base-deployment-host-linux.md`

## 前端现状

- 技术栈：`React + TypeScript + Vite + React Router + TanStack Query + Zustand + Ant Design`
- 当前已实现：登录、文档中心、检索页、问答页、任务详情、Query Log、权限绑定
- Vite 代理支持通过 `VITE_API_PROXY_TARGET` 与 `VITE_PORT` 切换宿主机后端或 Docker 后端

## 本地联调

### 宿主机模式

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run_all_local.ps1 -StartFrontend -SkipWorker -SeedTestData -SkipEnvCheck
powershell -ExecutionPolicy Bypass -File scripts/status_local.ps1 -CheckHealth
powershell -ExecutionPolicy Bypass -File scripts/verify_local_stack.ps1 -FrontendEndpoint http://127.0.0.1:5173 -BackendEndpoint http://127.0.0.1:8080
```

默认地址：

- 前端：`http://127.0.0.1:5173`
- 后端：`http://127.0.0.1:8080`

### Docker 后端模式

```powershell
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
```

当前已验证的一组地址：

- Docker 后端：`http://127.0.0.1:18080`
- Docker Nginx 统一入口：`http://127.0.0.1`
- 宿主机前端联调示例：`http://127.0.0.1:5176` 代理到 `18080`

## storage.mode 与 MinIO 联调说明

文档源文件存储现在支持两种模式：

- `local`：宿主机开发模式默认使用。上传文件会写入 `KB_STORAGE_UPLOAD_ROOT`，parser-worker 直接从共享目录读取。
- `minio`：Docker 集成模式默认使用。后端上传文件后会写入 MinIO，`storage_path` 记录为 `minio://<bucket>/<object>`，parser-worker 再从 MinIO 下载处理。

当前 Docker 默认配置：

- `KB_STORAGE_MODE=minio`
- `KB_STORAGE_BUCKET=kb-uploads`
- backend 使用 `KB_MINIO_ENDPOINT / KB_MINIO_ACCESS_KEY / KB_MINIO_SECRET_KEY`
- parser-worker 使用 `KB_STORAGE_ENDPOINT / KB_STORAGE_ACCESS_KEY / KB_STORAGE_SECRET_KEY / KB_STORAGE_BUCKET`

这次已经实际验证通过的链路包括：

- `upload -> ingest success`
- `reparse -> success`
- 旧 seed 文档 `/uploads/customer-credit-policy.pdf -> reparse success`
- `nginx -> /api/auth/login`

如果需要把宿主机模式切回本地文件共享，请显式设置：

```env
KB_STORAGE_MODE=local
KB_STORAGE_UPLOAD_ROOT=parser-worker/mock-storage
```

## 常用脚本

```powershell
powershell -ExecutionPolicy Bypass -File scripts/stop_all_local.ps1 -Force
powershell -ExecutionPolicy Bypass -File scripts/reset_local_state.ps1 -StopServices
```

## 认证与鉴权

- `POST /api/auth/login` 用于获取 Bearer JWT
- 除 `/api/auth/login`、`/actuator/health`、`/actuator/info` 外，其余 API 默认要求登录
- 文档上传、批量导入、重解析、版本激活、权限绑定等管理写接口要求 `admin`
- 资源级权限规则模型已保留，但尚未接入检索、问答和文档读取链路