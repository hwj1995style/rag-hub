# Docker 部署说明

## 1. 作用

本目录保存 `rag-hub` 的跨平台 Docker 部署文件，适用于：

- Linux Docker Engine
- macOS Docker Desktop
- Windows Docker Desktop

## 2. 文件清单

- `docker-compose.yml`
- `.env.example`
- `nginx.conf`

## 3. 组件清单

当前 compose 栈包含：

- MySQL
- Redis
- MinIO
- Elasticsearch
- Qdrant
- rag-hub-backend
- rag-hub-parser-worker
- nginx

## 4. 快速使用

### 4.1 准备环境文件

```bash
cp deploy/docker/.env.example deploy/docker/.env
```

按需修改端口、密码和开关配置。默认 MySQL 宿主机端口为 `13306`。

### 4.2 准备 backend 包

compose 默认需要：

- `backend/target/rag-hub-backend-0.0.1-SNAPSHOT.jar`

### 4.3 启动容器

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
```

### 4.4 查看状态

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env ps
```

### 4.5 停止容器

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env down
```

## 5. 认证相关变量

建议至少配置：

- `KB_JWT_ISSUER`
- `KB_JWT_SECRET`
- `KB_JWT_EXPIRATION_MINUTES`
- `KB_BOOTSTRAP_ADMIN_ENABLED`

默认 Docker 配置中 `KB_BOOTSTRAP_ADMIN_ENABLED=false`，生产和联调环境应优先使用预置管理员账号，而不是长期依赖 bootstrap admin。
