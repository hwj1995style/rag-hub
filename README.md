# rag-hub

rag-hub 是一个面向文档接入、检索问答、权限治理和任务运营的 RAG 运维平台。

当前仓库采用以下部署原则：
- 前端部署方式只保留 Docker 和 Host Linux
- 后端部署方式只保留 Docker 和 Host Linux
- WSL 仅保留给工具链使用，主要承担前端打包和 Playwright 回归

## 目录说明

- `backend/`：Spring Boot 后端 API
- `frontend/`：React 管理控制台
- `parser-worker/`：解析与索引 worker
- `deploy/`：Docker 与 Host Linux 部署资产
- `scripts/`：打包、重发、健康检查、Playwright 等辅助脚本
- `docs/`：设计、开发、测试、部署文档

## 关键文档

- `docs/frontend-architecture.md`
- `docs/frontend-development-guide.md`
- `docs/knowledge-base-authentication.md`
- `docs/knowledge-base-api-spec.md`
- `docs/knowledge-base-deployment-docker.md`
- `docs/knowledge-base-deployment-host-linux.md`
- `docs/knowledge-base-document-permission-design.md`
- `docs/knowledge-base-permission-governance-enhancement-design.md`
- `docs/knowledge-base-batch-import-followup-design.md`
- `docs/knowledge-base-test-cases.md`

## 前端当前能力

技术栈：
- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Ant Design

当前页面：
- 登录页
- 文档列表
- 文档详情
- Chunk 浏览页
- 搜索工作台
- 问答工作台
- 权限治理页
- 任务中心
- 任务详情页
- 查询日志列表与详情页

## 固定本地发版流程

代码改动后，统一按脚本重发，避免手工尝试。

仅后端改动：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_backend_docker.ps1
```

仅前端改动：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_frontend_docker.ps1
```

前后端一起改动：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_dev_stack.ps1
```

查看整套状态：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/status_dev_stack.ps1
```

## Docker 联调模式

当前主联调模式为：
- Docker 前端
- Docker 后端
- Docker 中间件依赖
- WSL Playwright 回归

启动整套环境：
```powershell
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env.example up -d
```

访问入口：
- 前端：`http://127.0.0.1/`
- 后端健康检查：`http://127.0.0.1:8080/actuator/health`
- Nginx 统一入口：`http://127.0.0.1/`

## Host Linux 部署模式

Host Linux 现在也包含前端发布资产：
- `scripts/package_frontend.ps1`
- `deploy/linux/deploy_frontend.sh`
- `deploy/linux/rollback_frontend.sh`
- `deploy/nginx/kb.conf`

前端静态产物默认发布到 `/app/kb/frontend/current`，由宿主机 Nginx 提供服务。

## WSL Playwright 回归

WSL 不再负责前端部署，但仍用于：
- 维护 Linux Node 24 工具链
- 在需要时打包前端产物
- 对 Docker 或 Host Linux 部署执行 Playwright 回归

初始化 WSL Node 24：
```powershell
wsl -d Ubuntu -- bash /mnt/d/Projects/rag-hub/scripts/bootstrap_playwright_wsl.sh
```

对 Docker 部署前端执行回归：
```powershell
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && bash scripts/run_playwright_wsl.sh'
```

对 Host Linux 部署执行回归：
```powershell
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && HOST_BASE_URL=http://<host-linux-ip> bash scripts/run_playwright_wsl_host.sh'
```

## 中文文档协作约定

为了避免 Windows / PowerShell 环境把中文写坏成 `?`，仓库协作时请遵循：
- 中文 Markdown 统一按 UTF-8 写入
- 新的写入路径先做 canary 验证，再批量改文档
- 优先整文件重写，不在不安全路径里逐行 patch 中文
- 每批文档修改后做一次乱码校验

更完整的规则见：
- `AGENTS.md`
## 已验证回归范围

当前 WSL Playwright 覆盖：
- 登录
- 文档列表与文档详情
- 搜索
- 问答
- 任务中心与任务详情
- 批量导入同来源跟进
- 查询日志列表与详情
- 上传
- 批量导入
- 重解析
- 版本激活
- 权限治理（加载、绑定、删除单条策略、按主体查询）
- 上传 / 搜索 / QA / 权限绑定等失败提示
- 缺失任务与缺失查询日志提示
- viewer 403
- 无效 token 401 跳登录

最新验证结果：
- `31 passed`