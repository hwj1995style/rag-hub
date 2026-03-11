# rag-hub Docker 部署文档

## 适用范围

本文档用于通过 Docker / Docker Compose 部署 `rag-hub`，适用于：

- Linux Docker Engine
- Windows Docker Desktop
- macOS Docker Desktop

## 首次部署最短路径

### 准备环境文件

```bash
cp deploy/docker/.env.example deploy/docker/.env
```

默认宿主机 MySQL 端口映射为 `13306 -> 3306`，用于规避本机常见的端口冲突。

### 准备 backend 包

需要存在：

- `backend/target/rag-hub-backend-0.0.1-SNAPSHOT.jar`

### 启动容器

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
```

### 查看状态

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env ps
```

### 停止容器

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env down
```

## 认证配置

建议显式配置：

```env
KB_JWT_ISSUER=rag-hub
KB_JWT_SECRET=replace-with-a-strong-secret
KB_JWT_EXPIRATION_MINUTES=120
KB_BOOTSTRAP_ADMIN_ENABLED=false
```

如需首次联调验证，可以临时开启 bootstrap admin，初始化完成后再关闭。

## 启动顺序

Compose 已内置健康依赖链：

- `mysql healthy -> rag-hub-backend`
- `mysql healthy -> rag-hub-parser-worker`
- `rag-hub-backend healthy -> nginx`

## storage.mode 与 MinIO 联调说明

### 默认 Docker 存储模式

Docker 当前默认使用：

```env
KB_STORAGE_MODE=minio
KB_STORAGE_BUCKET=kb-uploads
```

这意味着：

- backend 上传时会把真实源文件写入 MinIO
- 数据库中的 `storage_path` 会记录为 `minio://kb-uploads/...`
- parser-worker 在处理 ingest / reparse 任务时，会先从 MinIO 下载源文件，再进行切块和索引

### 关键变量

backend 侧主要使用：

```env
KB_MINIO_ENDPOINT=http://minio:9000
KB_MINIO_ACCESS_KEY=minioadmin
KB_MINIO_SECRET_KEY=minioadmin123
KB_STORAGE_MODE=minio
KB_STORAGE_BUCKET=kb-uploads
```

parser-worker 侧主要使用：

```env
KB_STORAGE_ENDPOINT=http://minio:9000
KB_STORAGE_ACCESS_KEY=minioadmin
KB_STORAGE_SECRET_KEY=minioadmin123
KB_STORAGE_BUCKET=kb-uploads
KB_STORAGE_MODE=minio
```

### 兼容旧路径

为了兼容已有 seed 数据，worker 仍保留对旧路径的回退支持：

- 如果 `storage_path` 是旧的 `/uploads/...`
- worker 会先按 MinIO 逻辑尝试
- 若未命中，再回退到本地 `mock-storage`

### 已验证结果

当前已经在 Docker 环境中实际验证通过：

- 新上传文档：`upload -> ingest success`
- 新上传文档：`reparse -> success`
- 旧 seed 文档：`/uploads/customer-credit-policy.pdf -> reparse success`
- 统一入口：`nginx -> /api/auth/login`

## 排障建议

如果 Docker 中仍然出现上传后任务失败，优先检查：

1. `rag-hub-backend` 是否拿到了 `KB_STORAGE_MODE=minio`
2. `rag-hub-parser-worker` 是否拿到了 `KB_STORAGE_ENDPOINT / ACCESS_KEY / SECRET_KEY / BUCKET`
3. MinIO 是否健康，且 `http://127.0.0.1:9000` 可访问
4. `docker logs rag-hub-parser-worker` 中是否仍然出现 `source file not found`

如果你明确要切回本地共享目录模式，请同时对齐：

```env
KB_STORAGE_MODE=local
KB_STORAGE_UPLOAD_ROOT=./mock-storage
```