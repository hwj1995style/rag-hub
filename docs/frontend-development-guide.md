# rag-hub 前端开发文档

## 1. 文档目标

本文档用于指导 `frontend/` 工程的迭代开发，并约束前后端分离后的本地联调方式、页面优先级和交付边界。

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

### 阶段 4：本地联调收敛
完成内容：
- 宿主机模式联调
- Docker 后端模式联调
- 上传、重解析、版本激活、权限绑定等 admin 写接口验证
- 状态检查与联调重置脚本

## 5. 本地联调模式

### 模式一：宿主机联调
适用场景：
- 开发前端页面
- 联调宿主机 Spring Boot 后端
- 使用内存 H2 seed 数据快速回归

默认地址：
- 前端：`http://127.0.0.1:5173`
- 后端：`http://127.0.0.1:8080`

常用命令：
- 启动：`powershell -ExecutionPolicy Bypass -File scripts/run_all_local.ps1 -StartFrontend -SkipWorker -SeedTestData -SkipEnvCheck`
- 状态：`powershell -ExecutionPolicy Bypass -File scripts/status_local.ps1 -CheckHealth`
- 验证：`powershell -ExecutionPolicy Bypass -File scripts/verify_local_stack.ps1 -FrontendEndpoint http://127.0.0.1:5173 -BackendEndpoint http://127.0.0.1:8080`
- 停止：`powershell -ExecutionPolicy Bypass -File scripts/stop_all_local.ps1 -Force`

### 模式二：Docker 后端联调
适用场景：
- 验证 MySQL、Redis、MinIO、Elasticsearch、Qdrant、parser-worker 等容器依赖
- 验证 Docker backend 的认证与健康检查
- 验证前端通过代理访问容器 backend 的链路

当前验证过的一组端口：
- Docker backend：`http://127.0.0.1:18080`
- Docker 联调前端：`http://127.0.0.1:5176`

Vite 代理切换方式：
- `frontend/vite.config.ts` 支持使用 `VITE_API_PROXY_TARGET` 指定代理目标
- `VITE_PORT` 可用于起第二份前端实例

示例：
- `VITE_API_PROXY_TARGET=http://127.0.0.1:18080`
- `VITE_PORT=5176`

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

宿主机联调已验证：
- 登录
- 文档列表
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

Docker 侧已验证：
- parser-worker 容器启动
- Docker backend 健康检查
- Docker backend 登录
- 宿主机前端代理到 Docker backend 的登录、搜索、问答、权限绑定等链路

## 9. 重置与清理

用于清理宿主机联调环境：
- `powershell -ExecutionPolicy Bypass -File scripts/reset_local_state.ps1 -StopServices`

效果：
- 停止宿主机 frontend / backend 进程
- 清理 `.runtime/`
- 清理本地产物目录
- 下次以 `-SeedTestData` 启动时重新恢复 seed 数据

## 10. 当前仍未覆盖的范围

目前仍建议后续补齐：
- 浏览器自动化回归
- parser-worker 结果级验证，而不只是容器启动
- Docker `nginx` 整体入口验证
- 资源级权限真正生效后的前后端联调
