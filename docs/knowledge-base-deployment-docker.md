# rag-hub Docker 部署文档

## 1. 适用范围

本文档用于通过 Docker / Docker Compose 部署 `rag-hub`，适用于：

- Linux Docker Engine
- Windows Docker Desktop
- macOS Docker Desktop

## 2. 首次部署最短路径

### 2.1 准备环境文件

```bash
cp deploy/docker/.env.example deploy/docker/.env
```

默认宿主机 MySQL 端口是 `13306 -> 3306`，用于避免部分环境下 `3306` 被占用或被限制。

### 2.2 准备 backend 包

需要文件：

- `backend/target/rag-hub-backend-0.0.1-SNAPSHOT.jar`

### 2.3 启动容器

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
```

### 2.4 查看状态

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env ps
```

### 2.5 停止容器

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env down
```

## 3. 认证配置

建议显式配置：

```env
KB_JWT_ISSUER=rag-hub
KB_JWT_SECRET=replace-with-a-strong-secret
KB_JWT_EXPIRATION_MINUTES=120
KB_BOOTSTRAP_ADMIN_ENABLED=false
```

如需首次初始化管理员，可以临时开启 bootstrap admin，待初始化完成后再关闭。

## 4. 启动顺序

Compose 已内置健康检查依赖链：

- `mysql healthy -> rag-hub-backend`
- `mysql healthy -> rag-hub-parser-worker`
- `rag-hub-backend healthy -> nginx`
