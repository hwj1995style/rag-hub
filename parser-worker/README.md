# rag-hub Parser Worker

## 1. 作用

`parser-worker` 是 `rag-hub` 的 Python 解析与索引 worker，负责：

- 轮询 MySQL 中的待处理任务
- 读取文档和版本元数据
- 解析文档内容并切分 chunk
- 写入 `kb_chunk`
- 写入 Elasticsearch 全文索引
- 写入 Qdrant 向量索引
- 回写 `kb_chunk_vector_ref`
- 更新解析状态和索引状态

## 2. 配置文件

默认配置文件：

- `config.yml`

关键配置项：

- `database.*`：MySQL 连接配置
- `search.*`：Elasticsearch 地址和索引名
- `vector.endpoint`：Qdrant 地址
- `vector.collection_name`：Qdrant collection 名称
- `vector.embedding_dim`：embedding 维度

## 3. 当前能力范围

当前实现已经支持：

- 原子认领 `pending` 任务
- 解析并落库 chunk
- 向 Elasticsearch 写入全文索引
- 向 Qdrant 写入向量
- 在 MySQL 中保存 `kb_chunk_vector_ref` 映射
- 分别回写 `parse_status` 和 `index_status`

## 4. 常用命令

### 4.1 本地运行

```powershell
../scripts/run_parser_worker.ps1 -InstallDeps
```

### 4.2 运行测试

```powershell
../scripts/test_parser_worker.ps1
```

### 4.3 打包

```powershell
../scripts/package_parser_worker.ps1
```

## 5. 一键重建样例数据

如需执行一轮完整样例入库并验证接口，可运行：

```powershell
../scripts/reindex_sample_data.ps1
```

之后可继续执行：

```powershell
../scripts/api_smoke_test.ps1
../scripts/api_assert_test.ps1
../scripts/verify_local_stack.ps1
```

## 6. CI

CI 文件：

- `../.github/workflows/ci.yml`

当前 CI 会校验：

- backend 测试
- parser-worker 测试
- 关键脚本存在性
