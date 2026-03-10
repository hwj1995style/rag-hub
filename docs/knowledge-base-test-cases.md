# rag-hub 测试案例文档

## 1. 文档目标

本文档用于指导当前 `rag-hub` 项目的一期测试设计与验收，覆盖：

- 功能测试
- 接口测试
- 权限测试
- 异常测试
- 性能测试
- 上线验收

当前系统落地架构为：`MySQL + Elasticsearch + Qdrant + MinIO`。

## 2. 测试范围

一期测试范围包括：

- 文档上传与批量导入
- 文档解析与分块
- Elasticsearch 全文索引
- Qdrant 向量索引
- 文档检索与问答
- 权限控制
- 查询日志
- 发布后健康检查

## 3. 测试环境

建议准备以下环境：

- 开发环境：开发自测与接口调试
- 测试环境：功能回归、联调、UAT
- 预发环境：上线前最终验证

环境组件至少包含：

- MySQL 8.0
- Elasticsearch
- Qdrant
- MinIO
- backend
- parser-worker

## 4. 功能测试案例

### 4.1 文档上传

用例目标：

- 上传 PDF、Word、Excel、PPT、Markdown 文件
- 创建文档记录、版本记录和入库任务

通过标准：

- 接口返回成功
- `kb_document`、`kb_document_version`、`kb_ingest_task` 数据正确

### 4.2 文档解析

用例目标：

- parser-worker 正常拉取待处理任务
- 成功写入 `kb_chunk`

通过标准：

- 任务状态变为 `success`
- 版本状态 `parse_status=success`
- 分块数大于 0

### 4.3 全文索引

用例目标：

- 分块文本成功写入 Elasticsearch

通过标准：

- `kb_chunk` 索引存在
- `_count` 大于 0
- 能按关键词命中结果

### 4.4 向量索引

用例目标：

- 分块向量成功写入 Qdrant

通过标准：

- collection 存在
- `points_count` 大于 0
- `kb_chunk_vector_ref` 存在映射记录

### 4.5 搜索接口

接口：

- `POST /api/search/query`

通过标准：

- 返回 `KB-00000`
- `items` 不为空
- 命中文档、标题路径、摘要信息正确

### 4.6 问答接口

接口：

- `POST /api/qa/query`

通过标准：

- 返回 `KB-00000`
- `answer` 非空
- `citations` 至少 1 条
- `retrievedCount >= 1`
- 写入 `kb_query_log`

## 5. 权限测试案例

### 5.1 文档权限过滤

目标：

- 无权限用户不能检索到受限文档

通过标准：

- 搜索结果中不返回无权文档
- QA 不引用无权分块

### 5.2 权限绑定接口

接口：

- `POST /api/permissions/bind`

通过标准：

- 绑定后数据库存在对应策略
- 重新检索后权限生效

## 6. 异常测试案例

### 6.1 非法文件上传

目标：

- 上传不支持格式或空文件

通过标准：

- 返回明确错误码
- 不生成错误任务或脏数据

### 6.2 索引失败

目标：

- 模拟 Elasticsearch 或 Qdrant 不可用

通过标准：

- 任务失败原因可追踪
- `index_status=failed`
- 可重新执行重建

### 6.3 大模型调用失败

目标：

- 模拟网关 401、429、5xx

通过标准：

- 返回明确业务错误码
- 当 `fail-open=true` 时按配置降级

## 7. 性能测试建议

建议压测以下场景：

- 文档上传峰值并发
- 检索接口响应时间
- 问答接口响应时间
- parser-worker 批量入库吞吐

关键指标建议：

- 搜索 P95 响应时间
- QA P95 响应时间
- 单文档平均入库耗时
- 单批次任务成功率

## 8. 上线验收清单

上线前至少完成：

- backend 单元测试通过
- parser-worker 单元测试通过
- 本地或测试环境联调通过
- `verify_local_stack.ps1` 或等价验收脚本通过
- Host Linux 或 Docker 部署手册走通

## 9. 推荐验收入口

- 本地联调验收：
  - `scripts/verify_local_stack.ps1`
- 接口烟雾测试：
  - `scripts/api_smoke_test.ps1`
- 严格断言测试：
  - `scripts/api_assert_test.ps1`

## 10. 相关文档

- [开发指南](./knowledge-base-development-guide.md)
- [实施方案](./knowledge-base-implementation-plan.md)
- [API 规范](./knowledge-base-api-spec.md)
- [DDL 与初始化](./knowledge-base-ddl-and-init.md)
- [运维手册](./knowledge-base-ops-handbook.md)
