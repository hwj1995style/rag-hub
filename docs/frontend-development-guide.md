# rag-hub 前端开发文档

## 1. 文档目标

本文档将前端实现拆成可落地的开发阶段，便于逐步交付并与现有后端能力对齐。

## 2. 第一阶段目标

首批交付目标是形成可用的管理后台，至少满足：

- 能登录
- 能查看文档列表和详情
- 能查看 chunk
- 能执行搜索
- 能执行问答
- admin 可见并可调用管理写接口

## 3. 工程初始化

建议新增目录：`frontend/`

推荐初始化命令：

```bash
npm create vite@latest frontend -- --template react-ts
```

建议核心依赖：

```bash
react-router-dom
@tanstack/react-query
zustand
axios
antd
@ant-design/icons
```

## 4. 分阶段开发计划

### 阶段 1：工程骨架

完成：

- Vite + React + TypeScript 初始化
- router
- query provider
- Ant Design 接入
- 基础布局
- `httpClient`
- local env 和 proxy 配置

### 阶段 2：认证链路

完成：

- 登录页
- `/api/auth/login` 集成
- token 持久化
- route guard
- logout
- `401` 自动处理

### 阶段 3：文档中心

完成：

- 文档列表页
- 文档详情页
- chunk 查看

优先接入：

- `GET /api/documents`
- `GET /api/documents/{documentId}`
- `GET /api/documents/{documentId}/chunks`

其后再接入 admin 动作：

- upload
- batch import
- reparse
- activate version

### 阶段 4：检索工作台

完成：

- 查询输入区
- 可选 filters
- 结果列表
- 显示文档标题、定位、分数、摘要

接口：`POST /api/search/query`

### 阶段 5：QA 工作台

完成：

- 问题输入
- 答案展示
- citations 展示
- topK / sessionId 控制
- query log 跳转

接口：

- `POST /api/qa/query`
- `GET /api/query-logs/{logId}`

### 阶段 6：权限与任务

完成：

- 权限绑定页
- 任务详情页

接口：

- `POST /api/permissions/bind`
- `GET /api/tasks/{taskId}`

## 5. 推荐开发顺序

1. 登录页
2. 主布局
3. 文档列表
4. 文档详情
5. chunk 查看
6. 搜索页
7. QA 页
8. 权限页
9. 任务页

## 6. API 处理规则

- 页面不直接调用 axios
- 统一解析 `code/message/traceId/data`
- 非 `KB-00000` 视为业务错误
- 自动注入 Bearer token

建议 query key：

- `['documents', filters]`
- `['document', documentId]`
- `['documentChunks', documentId, params]`
- `['search', request]`
- `['qa', request]`
- `['task', taskId]`
- `['queryLog', logId]`

## 7. 本地联调建议

推荐端口：

- frontend：`5173`
- backend：`8080`

Vite proxy：

- `/api` -> backend
- `/actuator` -> backend

联调顺序：

1. 登录
2. 文档列表
3. 文档详情与 chunks
4. 搜索
5. QA
6. admin 写接口

## 8. 验收清单

- 登录成功与失败反馈正常
- 刷新后登录态保持
- `401` 跳回登录页
- `403` 有无权限提示
- 文档列表、详情、chunk 可正常查看
- 搜索结果可展示
- QA 答案与引用可展示
- admin 与非 admin 按钮可见性有区别

## 9. 当前限制

目前后端还未完成资源级权限过滤，因此前端不应假设：

- 文档一定会按策略隐藏
- 搜索结果一定会按资源策略过滤
- QA 引用一定已经按资源权限裁剪

目前前端可做的仅是：

- 登录态控制
- 基于 `roleCode` 的 UI 可见性控制
