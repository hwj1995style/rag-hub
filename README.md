# rag-hub

`rag-hub` 是一个面向文档接入、混合检索、问答编排和权限治理的 RAG 管理平台。

## 主要入口

### 核心文档
- 总体设计：`docs/knowledge-base-implementation-plan.md`
- 开发指南：`docs/knowledge-base-development-guide.md`
- 前端设计：`docs/frontend-architecture.md`
- 前端开发：`docs/frontend-development-guide.md`
- 认证说明：`docs/knowledge-base-authentication.md`
- API 规范：`docs/knowledge-base-api-spec.md`
- Docker 部署：`docs/knowledge-base-deployment-docker.md`
- Host Linux 部署：`docs/knowledge-base-deployment-host-linux.md`

### 代码目录
- `backend/`：Spring Boot 后端 API
- `frontend/`：React 前端控制台
- `parser-worker/`：解析与索引 worker
- `scripts/`：本地开发、联调、验证脚本
- `deploy/`：Docker 与 Host Linux 部署资产
- `docs/`：设计、开发、部署与运维文档

## 前端现状

- 前端工程位于 `frontend/`
- 技术栈：`React + TypeScript + Vite + React Router + TanStack Query + Zustand + Ant Design`
- 当前已实现：登录、文档中心、检索工作台、问答工作台、权限绑定、任务详情、Query Log 详情
- `frontend/vite.config.ts` 支持通过 `VITE_API_PROXY_TARGET` 和 `VITE_PORT` 切换代理目标与端口

## 本地前后端联调

### 前置要求
- 推荐 Node `24.x`
- 后端使用仓库内 `tools/` 下的 JDK 17 与 Maven
- Windows 上如果 `nvm use` 弹出“加载设置失败（拒绝访问）”，请直接使用 Node 24 的绝对路径

### 模式一：宿主机联调
- 启动后端和前端：`powershell -ExecutionPolicy Bypass -File scripts/run_all_local.ps1 -StartFrontend -SkipWorker -SeedTestData -SkipEnvCheck`
- 查看状态：`powershell -ExecutionPolicy Bypass -File scripts/status_local.ps1 -CheckHealth`
- 执行联调验证：`powershell -ExecutionPolicy Bypass -File scripts/verify_local_stack.ps1 -FrontendEndpoint http://127.0.0.1:5173 -BackendEndpoint http://127.0.0.1:8080`
- 默认地址：前端 `http://127.0.0.1:5173`，后端 `http://127.0.0.1:8080`

### 模式二：Docker 后端联调
- Docker backend 可以映射到 `http://127.0.0.1:18080`
- 额外起一份前端 dev server 并将代理目标指向 Docker backend
- 当前已验证的一组地址：Docker backend `http://127.0.0.1:18080`，Docker 联调前端 `http://127.0.0.1:5176`
- 这条链路已实际验证通过：登录、文档列表、任务详情、Query Log、搜索、问答、权限绑定

### 常用命令
- 停止本地进程：`powershell -ExecutionPolicy Bypass -File scripts/stop_all_local.ps1 -Force`
- 重置本地联调数据：`powershell -ExecutionPolicy Bypass -File scripts/reset_local_state.ps1 -StopServices`

### 说明
- `reset_local_state.ps1` 会停止本地前后端进程、清理 `.runtime/` 和本地产物
- 重新执行启动脚本后，内存 H2 测试数据会按 seed SQL 恢复到初始状态
- 如果 `5173` 被占用，Vite 会自动切换端口，可从 `.runtime/logs/frontend.out.log` 查看实际地址

## 认证与权限

- `POST /api/auth/login` 用于换取 Bearer JWT
- 除 `/api/auth/login`、`/actuator/health`、`/actuator/info` 外，其余 API 默认都需要登录
- 文档上传、批量导入、重解析、版本激活、权限绑定等管理写接口需要 `admin` 角色
- 资源级权限策略模型已保留，但尚未接入检索、问答和文档读取链路

## 部署方式

- Docker：`deploy/docker/`
- Host Linux：`deploy/linux/`

更详细的前端实现规划请参考 `docs/frontend-architecture.md` 与 `docs/frontend-development-guide.md`。
