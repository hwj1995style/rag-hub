# 批量导入结果与任务跟进增强设计方案

## 1. 背景

当前项目已经具备批量导入入口：
- 前端文档页可提交 `batch import`
- 后端 `POST /api/documents/batch-import` 可以创建 `batch_import` 任务
- 任务中心可以查看全部任务，也可以按 `taskType=batch_import` 过滤

但当前链路仍然不够顺：
- 批量导入提交成功后，只能看到一条简要提示
- 如果管理员稍后再回到任务中心，难以按来源快速找回刚刚提交的导入任务
- 任务中心目前只能按 `status / taskType / documentId` 过滤，不能按 `sourceUri` 追踪批量导入任务
- 任务详情页对 `batch_import` 任务没有专门的跟进提示

这会导致批量导入虽然“能提交”，但后续排查和跟进效率不高。

## 2. 目标

本次实现一个不改动底层表结构的第一阶段增强：
- 任务中心支持按 `sourceUri` 关键字过滤
- 批量导入成功后，前端提供更直接的“打开同来源批量任务”入口
- `batch_import` 任务详情页增加更明确的跟进提示
- Playwright 回归补齐“批量导入后按来源跟进”的主链路

## 3. 非目标

本次明确不做以下内容：
- 不新增批量导入专用数据库表
- 不新增批量导入历史详情页
- 不实现一个 batch 对应多任务的编排模型
- 不增加批量导入任务重试功能
- 不引入新的任务元数据字段或 JSON 扩展字段

## 4. 设计原则

### 4.1 不改表结构

当前 `kb_ingest_task` 已经有：
- `taskType`
- `sourceUri`
- `status`
- `step`
- `errorMessage`

本次增强以现有 `sourceUri` 作为批量导入跟进主键线索，不增加新列。

### 4.2 优先增强跟进体验

本次不是要重做批量导入模型，而是把现有“提交任务 -> 回到任务中心 -> 找到对应任务”这条链路做顺。

## 5. 后端设计

### 5.1 任务列表接口增加来源过滤

现有接口：
- `GET /api/tasks`

新增可选查询参数：
- `sourceKeyword`

行为：
- 当传入 `sourceKeyword` 时，按 `sourceUri like %sourceKeyword%` 过滤任务
- 与现有 `status / taskType / documentId` 过滤条件叠加生效

### 5.2 Service 层扩展

`TaskService.listTasks(...)` 增加 `sourceKeyword` 参数。

### 5.3 返回结构

`TaskResponse` 本次不新增字段，仍复用已有：
- `taskType`
- `sourceUri`
- `status`
- `errorMessage`

因为本次目标是“更好查找”，不是“更丰富结构化元数据”。

## 6. 前端设计

### 6.1 文档页批量导入成功提示增强

在 `DocumentsPage` 的批量导入成功提示中新增：
- 打开 `batch_import` 任务列表
- 按当前 `sourceUri` 打开的同来源任务列表

示例跳转：
- `/tasks?taskType=batch_import`
- `/tasks?taskType=batch_import&sourceKeyword=s3://bucket/path`

### 6.2 任务中心过滤增强

任务中心新增一个过滤项：
- `Source URI contains`

作用：
- 输入来源关键字后，可以快速找回某次批量导入对应任务
- 也适用于 ingest / reparse 等有来源路径的任务

### 6.3 任务中心快速视图保持不变

现有 quick views 继续保留：
- All tasks
- Failed tasks
- Running tasks
- Batch imports
- Reparse tasks

本次不新增更多快速视图，以免页面继续膨胀。

### 6.4 任务详情页增强

当 `taskType=batch_import` 时，在任务详情页增加提示卡片：
- 当前任务来源是什么
- 可直接跳回“同来源批量任务”列表
- 如果失败，则提示先检查来源地址与任务错误信息

## 7. 测试方案

### 7.1 后端集成测试

至少新增：
- `GET /api/tasks?sourceKeyword=...` 可以按来源过滤 batch import 任务

### 7.2 前端 Playwright

至少新增：
- 批量导入成功后，可从成功提示进入批量任务列表
- 进入带 `sourceKeyword` 的任务列表后，页面 URL 与过滤结果正确

## 8. 落地顺序

建议顺序：
1. 后端 `sourceKeyword` 过滤支持
2. 前端任务中心过滤表单增强
3. 文档页成功提示增强
4. 任务详情页 batch import 跟进提示
5. Playwright 回归补齐

## 9. 当前建议

这次增强应保持“轻量但可感知”：
- 不追求重做批量导入模型
- 先把“提交后如何找回并继续跟进任务”做好
- 后续如果再扩展 batch history，再考虑引入更完整的数据模型