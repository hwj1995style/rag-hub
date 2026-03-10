# rag-hub 前端总体设计方案

## 1. 文档目标

本文档用于定义 `rag-hub` 在前后端分离模式下的前端总体设计，确保前端实现与现有总体方案、后端 API 和部署方式保持一致。

## 2. 前端在系统中的定位

后端目前已承担：

- 文档接入、版本管理、任务 API
- 混合检索与 QA 编排
- 权限绑定 API
- JWT 登录认证与角色校验

因此前端应作为独立 Web 应用，负责：

- 登录
- 文档管理界面
- 检索与问答工作台
- 权限编辑页
- 任务与日志可视化

这个前端本质上对应总体方案中的 `admin-console`。

## 3. 职责边界

### 前端负责

- 路由与页面渲染
- 登录态保存
- API 调用和错误反馈
- 表格、表单、上传、检索结果、问答结果展示
- 基于 `roleCode` 的 UI 可见性控制

### 后端负责

- 所有业务 API
- JWT 签发与校验
- admin 写接口鉴权
- 检索、问答、持久化、日志

### 前端暂不负责

- 资源级权限过滤
- parser 执行
- retrieval 编排
- refresh token 逻辑

## 4. 推荐技术栈

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Ant Design

这是当前阶段最务实、最适合管理后台的选择。

## 5. 推荐路由

- `/login`
- `/documents`
- `/documents/:documentId`
- `/documents/:documentId/chunks`
- `/search`
- `/qa`
- `/permissions`
- `/tasks/:taskId`
- `/query-logs/:logId`

## 6. 工程结构建议

```text
frontend/
  src/
    app/
    router/
    layouts/
    pages/
    features/
    services/
    stores/
    hooks/
    components/
    types/
    utils/
    styles/
```

## 7. 认证集成

建议保存：

- `accessToken`
- `tokenType`
- `expiresInSeconds`
- `userId`
- `username`
- `displayName`
- `roleCode`

建议行为：

- 使用 `localStorage` 保存 token
- 为业务路由设置 guard
- `401` 时清空 token 并跳转 `/login`
- `403` 时显示无权限提示
- 非 admin 用户隐藏 admin 操作

## 8. API 集成

建议封装统一 `httpClient`，负责：

- 使用 `/api` 作为 base path
- 注入 Bearer token
- 统一解析 `code/message/traceId/data`
- 统一处理 `401` / `403`

建议拆分 API 模块：

- `auth.ts`
- `documents.ts`
- `search.ts`
- `qa.ts`
- `permissions.ts`
- `tasks.ts`
- `queryLogs.ts`

## 9. 状态策略

使用 TanStack Query 管理服务端状态：

- 列表
- 详情
- 搜索结果
- QA 结果
- 任务详情

使用 Zustand 管理客户端状态：

- auth state
- token
- 布局状态
- 页面级轻量 UI 状态

## 10. 本地联调

推荐端口：

- frontend：`5173`
- backend：`8080`

Vite proxy：

- `/api` -> `http://127.0.0.1:8080`
- `/actuator` -> `http://127.0.0.1:8080`

## 11. 部署方式

推荐生产模式：

- 前端构建为静态资源
- 由 Nginx 托管前端
- `/api` 反向代理到 `rag-hub-backend`

这种方式能同时满足前后端分离与浏览器同源访问。
