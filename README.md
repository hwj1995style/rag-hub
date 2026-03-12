# rag-hub

`rag-hub` 是一个面向文档接入、检索问答、权限治理和任务运营的 RAG 管理平台。当前仓库已经完成前后端分离一期实现，后端仅保留 `Docker` 和 `Host Linux` 两种运行与部署模式。

## 主要目录

- `backend/`：Spring Boot 后端 API
- `frontend/`：React 前端控制台
- `parser-worker/`：解析与索引 worker
- `scripts/`：打包、测试、接口校验与 WSL 前端脚本
- `deploy/`：Docker 与 Host Linux 部署资产
- `docs/`：设计、开发、测试与部署文档

## 关键文档

- 总体设计：`docs/knowledge-base-implementation-plan.md`
- 后端开发：`docs/knowledge-base-development-guide.md`
- 前端设计：`docs/frontend-architecture.md`
- 前端开发：`docs/frontend-development-guide.md`
- 认证鉴权：`docs/knowledge-base-authentication.md`
- API 规范：`docs/knowledge-base-api-spec.md`
- Docker 部署：`docs/knowledge-base-deployment-docker.md`
- Host Linux 部署：`docs/knowledge-base-deployment-host-linux.md`
- 测试用例：`docs/knowledge-base-test-cases.md`

## 前端现状

- 技术栈：`React + TypeScript + Vite + React Router + TanStack Query + Zustand + Ant Design`
- 当前页面：登录、文档列表、文档详情、Chunk 浏览、搜索、问答、权限绑定、任务详情、Query Log 详情
- 自动化回归：已补齐 Playwright 核心回归用例

## 当前推荐联调方式

### WSL 前端 + Docker 后端

这是当前已经完整跑通并作为默认方案维护的联调方式。

首次准备 Ubuntu Node 24：

```powershell
wsl -d Ubuntu -- bash /mnt/d/Projects/rag-hub/scripts/bootstrap_frontend_wsl.sh
```

启动 Docker 后端：

```powershell
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env.example up -d
```

启动 WSL 前端：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start_frontend_wsl.ps1 -InstallDeps
```

查看状态：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/status_frontend_wsl.ps1
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env.example ps
```

停止环境：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/stop_frontend_wsl.ps1
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env.example down
```

默认地址：

- WSL 前端：`http://127.0.0.1:5174`
- Docker backend：`http://127.0.0.1:8080`
- Docker Nginx 统一入口：`http://127.0.0.1`

说明：

- 这台机器上的 `localhost` 端口转发偶尔不稳定。
- 如果 `127.0.0.1:5174` 无法访问，可以改用 WSL 内网地址，例如 `http://172.25.x.x:5174`。
- 前端代理目标由 `VITE_API_PROXY_TARGET` 控制，当前默认代理到 Docker backend `http://127.0.0.1:8080`。

### WSL 前端 + Host Linux 后端

适用于后端已经部署在 Linux 主机、前端只需要代理远端 API 的场景：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start_frontend_wsl.ps1 -ProxyTarget http://<host-linux-ip>:8080 -Port 5174
```

## Playwright 回归

当前 Playwright 已覆盖以下链路：

- 登录
- 文档列表与文档详情
- 搜索
- 问答
- 任务详情
- Query Log 详情
- 文档上传
- 重解析
- 版本激活
- 权限绑定
- 非法空文件上传失败提示
- 缺失 task/query log 的失败提示
- viewer 权限拦截
- 无效 token 401 跳登录

当前已经实测通过：`18 passed`

推荐运行方式：WSL Playwright + WSL 前端 + Docker 后端。

示例：

```powershell
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && bash scripts/run_playwright_wsl.sh'
```

如需只跑单条或部分用例，可以继续追加 Playwright 参数，例如：

```powershell
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && bash scripts/run_playwright_wsl.sh --grep "invalid stored token"'
```

如果 `127.0.0.1:5174` 不可达，可把 `PLAYWRIGHT_BASE_URL` 改成 WSL 内网地址。

## storage.mode 与 MinIO 说明

文档源文件存储支持两种模式：

- `local`：适用于 Host Linux 部署，上传文件写入 `KB_STORAGE_UPLOAD_ROOT`，worker 从共享目录读取
- `minio`：适用于 Docker 集成部署，后端上传文件后写入 MinIO，`storage_path` 记录为 `minio://<bucket>/<object>`，worker 再从 MinIO 下载处理

当前 Docker 默认配置：

- `KB_STORAGE_MODE=minio`
- `KB_STORAGE_BUCKET=kb-uploads`
- backend 使用 `KB_MINIO_ENDPOINT / KB_MINIO_ACCESS_KEY / KB_MINIO_SECRET_KEY`
- parser-worker 使用 `KB_STORAGE_ENDPOINT / KB_STORAGE_ACCESS_KEY / KB_STORAGE_SECRET_KEY / KB_STORAGE_BUCKET`

当前已验证通过的闭环：

- `upload -> ingest success`
- `reparse -> success`
- seed 文档 `/uploads/customer-credit-policy.pdf -> reparse success`
- `nginx -> /api/auth/login`
- WSL 前端 -> Docker backend 联调
- Playwright 全量回归

## 常用命令

```powershell
D:\App\nvm\nvm\v24.10.0\npm.cmd run build --prefix frontend
powershell -ExecutionPolicy Bypass -File scripts/status_frontend_wsl.ps1
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env.example ps
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env.example down
powershell -ExecutionPolicy Bypass -File scripts/api_smoke_test.ps1 -BackendEndpoint http://127.0.0.1:8080
powershell -ExecutionPolicy Bypass -File scripts/api_assert_test.ps1 -BackendEndpoint http://127.0.0.1:8080
```

## 认证与鉴权

- `POST /api/auth/login` 用于获取 Bearer JWT
- 除 `/api/auth/login`、`/actuator/health`、`/actuator/info` 外，其余 API 默认要求登录
- 文档上传、批量导入、重解析、版本激活、权限绑定等管理写接口要求 `admin`
- 资源级权限规则模型已保留，但尚未接入检索、问答和文档读取链路
