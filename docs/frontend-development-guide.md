# 前端开发指南

## 目标

本文档定义 `frontend/` 的当前开发、联调和发布方式。

当前固定原则：
- 前端部署方式只保留 Docker 和 Host Linux
- WSL 只保留给工具链使用，不再作为前端部署方式
- Playwright 回归统一在 WSL 中执行

## 当前实现范围

已实现页面：
- 登录页
- 文档列表
- 文档详情
- Chunk 浏览
- 搜索工作台
- 问答工作台
- 权限治理页（加载、绑定、删除单条策略、按主体查询）
- 任务中心
- 任务详情页
- 查询日志列表与详情页

已实现管理动作：
- 上传
- 批量导入
- 重解析
- 版本激活
- 权限治理（加载当前策略、整批绑定、删除单条、主体视角查询）

## 前端工程结构

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

## 当前联调方式

### 主联调模式

默认本地联调模式为：
- Docker 前端
- Docker 后端
- Docker 中间件依赖
- WSL Playwright

### 固定发版脚本

仅后端改动：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_backend_docker.ps1
```

仅前端改动：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_frontend_docker.ps1
```

前后端都改了：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_dev_stack.ps1
```

状态检查：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/status_dev_stack.ps1
```

### 说明

- `redeploy_backend_docker.ps1` 会打包后端 jar，并重建 Docker backend 镜像。
- `redeploy_frontend_docker.ps1` 会构建前端静态产物，并重建 Docker frontend 镜像与对外 nginx 入口。
- `redeploy_dev_stack.ps1` 会串联前后端重发流程。
- `status_dev_stack.ps1` 会检查 Docker 服务、前端公网入口和后端健康状态。

## Host Linux 联调方式

Host Linux 已经包含前端部署资产。

后端预检：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/check_host_linux_backend.ps1 -BackendEndpoint http://<host-linux-ip>:8080 -Username <admin-user> -Password <admin-password>
```

对 Host Linux 部署执行回归：
```powershell
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && HOST_BASE_URL=http://<host-linux-ip> bash scripts/run_playwright_wsl_host.sh'
```

## WSL 工具链方式

WSL 目前仍然负责：
- 初始化 Linux Node 24
- 辅助打包前端产物
- 执行 Playwright 浏览器回归

初始化命令：
```powershell
wsl -d Ubuntu -- bash /mnt/d/Projects/rag-hub/scripts/bootstrap_playwright_wsl.sh
```

对 Docker 部署前端执行回归：
```powershell
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && bash scripts/run_playwright_wsl.sh'
```

## 当前回归结果

最新验证结果：
- `31 passed`

当前已覆盖链路：
- 登录
- 文档列表与文档详情
- 搜索
- 问答
- 任务中心与任务详情
- 批量导入同来源跟进
- 查询日志列表与详情
- 权限治理（加载、绑定、删除单条、主体视角查询）
- 上传
- 批量导入
- 重解析
- 版本激活
- 主要内联失败提示
- viewer 403
- invalid token 401 redirect