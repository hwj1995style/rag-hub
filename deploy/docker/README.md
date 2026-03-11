# Docker 部署说明

## 作用

本目录保存 `rag-hub` 的 Docker Compose、Nginx 与环境变量模板，适用于：

- Linux Docker Engine
- Windows Docker Desktop
- macOS Docker Desktop

## 文件列表

- `docker-compose.yml`
- `.env.example`
- `nginx.conf`

## 组件清单

当前 Compose 栈包含：

- MySQL
- Redis
- MinIO
- Elasticsearch
- Qdrant
- rag-hub-backend
- rag-hub-parser-worker
- nginx

## 快速启动

### 准备环境文件

```bash
cp deploy/docker/.env.example deploy/docker/.env
```

MySQL 宿主机默认使用 `13306`，用于规避常见的 `3306` 端口冲突。

### 准备 backend 包

Compose 默认挂载：

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

## storage.mode 与 MinIO 联调说明

Docker 现在默认使用：

```env
KB_STORAGE_MODE=minio
KB_STORAGE_BUCKET=kb-uploads
```

在这套模式下：

- backend 会把上传源文件写入 MinIO
- `kb_document.source_uri` 与 `kb_document_version.storage_path` 会保存为 `minio://...`
- parser-worker 通过 `KB_STORAGE_ENDPOINT / KB_STORAGE_ACCESS_KEY / KB_STORAGE_SECRET_KEY / KB_STORAGE_BUCKET` 下载源文件

默认对齐关系如下：

- backend：`KB_MINIO_ENDPOINT=http://minio:9000`
- parser-worker：`KB_STORAGE_ENDPOINT=http://minio:9000`
- bucket：`KB_STORAGE_BUCKET=kb-uploads`

对于仍然使用 `/uploads/...` 的旧 seed 数据，worker 会先尝试 MinIO，再回退到本地 `mock-storage`。

## 认证配置建议

建议显式配置：

- `KB_JWT_ISSUER`
- `KB_JWT_SECRET`
- `KB_JWT_EXPIRATION_MINUTES`
- `KB_BOOTSTRAP_ADMIN_ENABLED`

在首次 Docker 验证或本地演示时，可以临时开启 bootstrap admin；长期环境建议使用正式初始化的管理员账号，并关闭 bootstrap admin。