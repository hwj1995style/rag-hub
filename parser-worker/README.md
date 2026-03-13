# rag-hub Parser Worker

## 作用

`parser-worker` 是 `rag-hub` 的 Python 解析与索引 worker。

当前主要负责：
- 从 MySQL 轮询待处理的 ingest / reparse 任务
- 从 MinIO 或本地兜底存储下载源文件
- 将源内容解析成 chunks
- 将 chunk 元数据写回 MySQL
- 将全文写入 Elasticsearch
- 将向量写入 Qdrant
- 更新任务、解析和索引状态

## 部署模式

当前支持：
- Docker
- Host Linux

## 常用脚本

- `../scripts/test_parser_worker.ps1`
- `../scripts/package_parser_worker.ps1`

## 推荐流程

### Docker 模式

```powershell
docker compose -f ../deploy/docker/docker-compose.yml --env-file ../deploy/docker/.env.example up -d rag-hub-parser-worker
```

### Host Linux 模式

请参考：
- `../docs/knowledge-base-deployment-host-linux.md`

## 测试

```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/test_parser_worker.ps1
```

## 打包

```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/package_parser_worker.ps1
```

## CI

CI 定义文件：
- `../.github/workflows/ci.yml`