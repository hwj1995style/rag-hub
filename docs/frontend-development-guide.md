# rag-hub 前端开发文档

## 1. 文档目标

本文档用于指导 `frontend/` 工程的迭代开发，并约束前后端分离后的联调方式、页面优先级和交付边界。

## 2. 当前实现范围

当前前端已经具备以下能力：
- 登录认证
- 文档列表、文档详情、chunk 浏览
- 搜索工作台
- 问答工作台
- 权限绑定
- 任务详情
- Query Log 详情

当前前端技术栈：
- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Ant Design

## 3. 工程目录建议

推荐目录结构如下：

```text
frontend/
  src/
    components/
    layouts/
    pages/
    router/
    services/
      api/
      http/
    stores/
    types/
    utils/
```

## 4. 开发阶段划分

### 阶段 1：工程骨架
完成内容：
- Vite + React + TypeScript 初始化
- Router 接入
- Query Client 接入
- Ant Design 接入
- 基础布局与登录态存储

### 阶段 2：认证链路
完成内容：
- 登录页
- Bearer Token 注入
- 路由守卫
- 401 自动跳转登录页
- 403 提示

### 阶段 3：核心业务页
完成内容：
- 文档列表
- 文档详情
- Chunk 浏览
- 搜索页
- QA 页
- 权限绑定页
- 任务详情页
- Query Log 详情页

### 阶段 4：联调收敛
完成内容：
- WSL 前端 + Docker 后端联调
- WSL 前端 + Host Linux 已部署后端联调
- 上传、重解析、版本激活、权限绑定等 admin 写接口验证
- Docker Nginx 统一入口验证

## 5. 联调模式

### 模式一：WSL 前端 + Docker 后端
适用场景：
- 日常前端开发
- 避开 Windows 宿主机上的 `spawn EPERM` 问题
- 验证 MySQL、Redis、MinIO、Elasticsearch、Qdrant、parser-worker 等容器依赖
- 验证 Docker backend 的认证、健康检查和任务闭环

首次准备：
- `wsl -d Ubuntu -- bash /mnt/d/Projects/rag-hub/scripts/bootstrap_frontend_wsl.sh`

默认地址：
- 前端：`http://127.0.0.1:5174`
- Docker backend：`http://127.0.0.1:8080`
- Docker Nginx：`http://127.0.0.1`

常用命令：
- 启动 Docker 后端：`docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env.example up -d`
- 启动前端：`powershell -ExecutionPolicy Bypass -File scripts/start_frontend_wsl.ps1 -InstallDeps`
- 查看状态：`powershell -ExecutionPolicy Bypass -File scripts/status_frontend_wsl.ps1`
- 停止前端：`powershell -ExecutionPolicy Bypass -File scripts/stop_frontend_wsl.ps1`
- 停止 Docker 环境：`docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env.example down`

### 模式二：WSL 前端 + Host Linux 已部署后端
适用场景：
- 联调远端 Linux 环境上的 backend 与 parser-worker
- 验证真实部署环境中的登录、检索、问答与管理接口

前提条件：
- Host Linux 已按 `docs/knowledge-base-deployment-host-linux.md` 完成部署
- 前端开发机能够访问目标 `http://<host-linux-ip>:8080`

启动示例：
- `powershell -ExecutionPolicy Bypass -File scripts/check_host_linux_backend.ps1 -BackendEndpoint http://<host-linux-ip>:8080 -Username <admin-user> -Password <admin-password>`
- `powershell -ExecutionPolicy Bypass -File scripts/start_frontend_wsl.ps1 -ProxyTarget http://<host-linux-ip>:8080 -Port 5174`
- `wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && HOST_BACKEND_URL=http://<host-linux-ip>:8080 bash scripts/run_playwright_wsl_host.sh'`

Vite 代理切换方式：
- `frontend/vite.config.ts` 使用 `VITE_API_PROXY_TARGET` 指定代理目标
- `VITE_PORT` 可用于切换端口

## 6. API 接入规则

统一要求：
- 页面不直接散落调用 `axios`
- 所有请求走 `services/api/*` 与 `services/http/client.ts`
- 统一解析 `code / message / traceId / data`
- 非 `KB-00000` 视为业务错误

推荐 Query Key：
- `['documents', filters]`
- `['document', documentId]`
- `['documentChunks', documentId, params]`
- `['search', request]`
- `['qa', request]`
- `['task', taskId]`
- `['queryLog', logId]`

## 7. 页面联调建议顺序

建议顺序：
1. 登录
2. 文档列表
3. 文档详情与 chunk
4. 搜索
5. 问答
6. 任务与 Query Log
7. admin 写接口

## 8. 已验证的联调范围

WSL 前端 + Docker backend 已验证：
- 登录
- 文档列表
- `5174 -> 8080` API 代理
- `/actuator/health` 透传
- Docker backend 认证成功

此前前端 + Docker backend 业务链路还已验证：
- 文档详情
- chunk 过滤
- 搜索
- 问答
- 任务详情
- Query Log 详情
- 上传
- 重解析
- 版本激活
- 权限绑定
- viewer 调 admin 接口返回 403
- Docker `nginx -> backend` 统一入口
- MinIO 存储闭环与 parser-worker 任务成功

前端 + Host Linux backend 待使用已部署环境按同样链路回归。

## 9. 当前仍未覆盖的范围

目前仍建议后续补齐：
- 在 WSL 前端环境下把 Playwright 全量跑通
- 浏览器自动化以外的整页人工回归清单
- 资源级权限真正生效后的前后端联调
- 更大规模样本下的任务吞吐与性能验证
## 10. 2026-03-12 Integration Update

- Primary local workflow is now `WSL frontend + Docker backend`.
- The Docker backend endpoint used by the frontend proxy is `http://127.0.0.1:8080`.
- Playwright now runs inside WSL against the WSL frontend and Docker backend successfully.
- Latest verified result: `18 passed`.
- Covered flows now include login, documents, chunks, search, QA, task detail, query log detail, upload, reparse, activate, permission bind, empty-file failure, permission-binding failure, missing task/query-log failures, viewer 403, invalid token 401 redirect, and inline failure states.
- Remaining gaps are Host Linux regression, dependency-outage UX validation, and resource-level authorization after backend implementation.
