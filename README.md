# rag-hub

`rag-hub` 是一个面向文档接入、检索问答、权限治理和任务运营的 RAG 管理平台。当前仓库已完成前后端分离一期实现，后端仅保留 Docker 与 Host Linux 两种运行/部署模式。

## 主要目录

- `backend/`：Spring Boot 后端 API
- `frontend/`：React 前端控制台
- `parser-worker/`：解析与索引 worker
- `scripts/`：打包、测试、接口校验脚本
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
- Vite 代理支持通过 `VITE_API_PROXY_TARGET` 与 `VITE_PORT` 指向 Docker 后端或已部署的 Host Linux 后端

## 前后端联调

### 推荐方式：前端本机开发 + Docker 后端

```powershell
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
cd frontend
D:\App\nvm\nvm\v24.10.0\npm.cmd install
$env:VITE_API_PROXY_TARGET = 'http://127.0.0.1:18080'
D:\App\nvm\nvm\v24.10.0\npm.cmd run dev
```

默认地址：

- 前端：`http://127.0.0.1:5173`
- Docker backend：`http://127.0.0.1:18080`
- Docker Nginx 统一入口：`http://127.0.0.1`

### 可选方式：前端本机开发 + Host Linux 后端

适用于后端已经部署到 Linux 主机、前端只需要代理远端 API 的场景。

```powershell
cd frontend
$env:VITE_API_PROXY_TARGET = 'http://<host-linux-ip>:8080'
D:\App\nvm\nvm\v24.10.0\npm.cmd run dev
```

## storage.mode 与 MinIO 说明

文档源文件存储支持两种模式：

- `local`：适用于 Host Linux 部署，上传文件写入 `KB_STORAGE_UPLOAD_ROOT`，worker 从共享目录读取。
- `minio`：适用于 Docker 集成部署，后端上传文件后写入 MinIO，`storage_path` 记录为 `minio://<bucket>/<object>`，worker 再从 MinIO 下载处理。

当前 Docker 默认配置：

- `KB_STORAGE_MODE=minio`
- `KB_STORAGE_BUCKET=kb-uploads`
- backend 使用 `KB_MINIO_ENDPOINT / KB_MINIO_ACCESS_KEY / KB_MINIO_SECRET_KEY`
- parser-worker 使用 `KB_STORAGE_ENDPOINT / KB_STORAGE_ACCESS_KEY / KB_STORAGE_SECRET_KEY / KB_STORAGE_BUCKET`

当前已验证通过的链路包括：

- `upload -> ingest success`
- `reparse -> success`
- 旧 seed 文档 `/uploads/customer-credit-policy.pdf -> reparse success`
- `nginx -> /api/auth/login`

## 常用命令

```powershell
D:\App\nvm\nvm\v24.10.0\npm.cmd run build --prefix frontend
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env ps
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env down
powershell -ExecutionPolicy Bypass -File scripts/api_smoke_test.ps1 -BackendEndpoint http://127.0.0.1:18080
powershell -ExecutionPolicy Bypass -File scripts/api_assert_test.ps1 -BackendEndpoint http://127.0.0.1:18080
```

## 认证与鉴权

- `POST /api/auth/login` 用于获取 Bearer JWT
- 除 `/api/auth/login`、`/actuator/health`、`/actuator/info` 外，其余 API 默认要求登录
- 文档上传、批量导入、重解析、版本激活、权限绑定等管理写接口要求 `admin`
- 资源级权限规则模型已保留，但尚未接入检索、问答和文档读取链路
