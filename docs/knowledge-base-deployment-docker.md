# Docker 部署指南

## 适用范围

本文档说明 `rag-hub` 的 Docker 部署方式。

当前 Docker 栈包括：
- MySQL
- Redis
- MinIO
- Elasticsearch
- Qdrant
- `rag-hub-backend`
- `rag-hub-frontend`
- `rag-hub-parser-worker`
- 对外 `nginx`

## 快速开始

复制环境文件：
```bash
cp deploy/docker/.env.example deploy/docker/.env
```

启动整套环境：
```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
```

查看状态：
```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env ps
```

停止环境：
```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env down
```

## 对外入口

- 前端：`http://127.0.0.1/`
- 后端健康检查：`http://127.0.0.1:8080/actuator/health`
- 经过 nginx 的 API：`http://127.0.0.1/api/...`

## 固定本地发版命令

仅后端：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_backend_docker.ps1
```

仅前端：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_frontend_docker.ps1
```

前后端一起：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_dev_stack.ps1
```

查看状态：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/status_dev_stack.ps1
```

## 前端容器模型

前端镜像由以下文件构建：
- `deploy/docker/Dockerfile.frontend`
- `deploy/docker/frontend-site.conf`

对外 nginx 容器负责：
- `/api/*` -> `rag-hub-backend`
- `/actuator/health` -> `rag-hub-backend`
- `/` -> `rag-hub-frontend`

## 存储模式

Docker 环境默认走 MinIO：
```env
KB_STORAGE_MODE=minio
KB_STORAGE_BUCKET=kb-uploads
```

当前已经验证通过的存储闭环：
- `upload -> ingest success`
- `reparse -> success`
- `activate -> success`
- `frontend -> nginx -> backend` success

## 验证方式

当前 Docker 部署链路已用这些方式验证：
- 公网前端入口 `http://127.0.0.1/`
- 后端健康检查 `http://127.0.0.1:8080/actuator/health`
- WSL Playwright 对 Docker 部署前端执行回归

最新验证结果：
- `31 passed`