# rag-hub Host Linux 部署文档

## 1. 适用范围

本文档用于主机直装模式部署，适用于：

- RHEL / Rocky / AlmaLinux / CentOS 类发行版
- Ubuntu / Debian 类发行版

部署方式为：

- 主机安装 Java、Python、Nginx、MySQL 客户端
- 使用 `systemd` 托管 `backend` 和 `parser-worker`
- 由主机 Nginx 做统一反向代理

## 2. 首次部署最短路径

首次部署建议按以下顺序执行：

### 2.1 环境预检

```bash
bash deploy/linux/preflight_check.sh
```

### 2.2 安装运行时

```bash
sudo bash deploy/linux/install_runtime.sh
```

### 2.3 准备环境文件

```bash
mkdir -p /app/kb/config
cp deploy/linux/kb.env.template /app/kb/config/kb.env
vi /app/kb/config/kb.env
```

### 2.4 发布 backend

```bash
/app/kb/deploy/linux/deploy_backend.sh
```

### 2.5 发布 parser-worker

```bash
/app/kb/deploy/linux/deploy_parser_worker.sh
```

### 2.6 执行验收

```bash
/app/kb/deploy/linux/verify_deployment.sh
```

### 2.7 回滚入口

```bash
/app/kb/deploy/linux/rollback_backend.sh
/app/kb/deploy/linux/rollback_parser_worker.sh
```

## 3. 目录结构

推荐目录：

- `/app/kb/backend`
- `/app/kb/parser-worker`
- `/app/kb/config`
- `/app/kb/logs`
- `/app/kb/packages`
- `/app/kb/backups`
- `/data/kb`

## 4. 关键脚本

- 环境预检：`deploy/linux/preflight_check.sh`
- 运行时安装：`deploy/linux/install_runtime.sh`
- 发布 backend：`deploy/linux/deploy_backend.sh`
- 发布 parser-worker：`deploy/linux/deploy_parser_worker.sh`
- 回滚 backend：`deploy/linux/rollback_backend.sh`
- 回滚 parser-worker：`deploy/linux/rollback_parser_worker.sh`
- 部署验收：`deploy/linux/verify_deployment.sh`

## 5. 环境文件

统一模板：

- `deploy/linux/kb.env.template`

推荐操作：

```bash
mkdir -p /app/kb/config
cp deploy/linux/kb.env.template /app/kb/config/kb.env
vi /app/kb/config/kb.env
```

## 6. systemd 与 Nginx

相关文件：

- `deploy/linux/systemd/rag-hub-backend.service`
- `deploy/linux/systemd/rag-hub-parser-worker.service`
- `deploy/nginx/kb.conf`
- `deploy/nginx/README.md`

## 7. 发布与回滚

发布前、发布中、发布后检查，以及回滚条件和回滚命令，统一维护在：

- [运维手册](./knowledge-base-ops-handbook.md)

## 8. 部署验收

部署完成后执行：

```bash
/app/kb/deploy/linux/verify_deployment.sh
```

验收重点：

- systemd 服务状态正常
- Nginx 反代正常
- MySQL / Elasticsearch / Qdrant / MinIO 可达
- `/actuator/health` 正常
- `/api/search/query` 可访问

## 9. 相关文档

- [运维手册](./knowledge-base-ops-handbook.md)
- [开发指南](./knowledge-base-development-guide.md)
