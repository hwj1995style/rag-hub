# Host Linux 部署指南

## 适用范围

本文档说明 Host Linux 部署模式。

当前 Host Linux 也包含前端部署资产：
- `scripts/package_frontend.ps1`
- `deploy/linux/deploy_frontend.sh`
- `deploy/linux/rollback_frontend.sh`
- `deploy/nginx/kb.conf`

## 推荐目录布局

- `/app/kb/backend`
- `/app/kb/parser-worker`
- `/app/kb/frontend/current`
- `/app/kb/config`
- `/app/kb/logs`
- `/app/kb/packages`
- `/app/kb/backups`

## 推荐部署顺序

环境预检：
```bash
bash deploy/linux/preflight_check.sh
```

安装运行时：
```bash
sudo bash deploy/linux/install_runtime.sh
```

准备环境变量文件：
```bash
mkdir -p /app/kb/config
cp deploy/linux/kb.env.template /app/kb/config/kb.env
vi /app/kb/config/kb.env
```

部署后端：
```bash
sudo /app/kb/deploy/linux/deploy_backend.sh
```

部署 parser worker：
```bash
sudo /app/kb/deploy/linux/deploy_parser_worker.sh
```

部署前端：
```bash
sudo /app/kb/deploy/linux/deploy_frontend.sh
```

部署验收：
```bash
/app/kb/deploy/linux/verify_deployment.sh
```

## 前端打包流程

在开发机上生成前端发布包：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/package_frontend.ps1
```

产物位置：
- `dist/frontend/rag-hub-frontend-dist.tar.gz`

将产物上传到 Host Linux 的包目录后，再执行 `deploy_frontend.sh`。

## Host Nginx 角色

`deploy/nginx/kb.conf` 会：
- 从 `/app/kb/frontend/current` 提供前端静态资源
- 将 `/api/*` 代理到 `127.0.0.1:8080`
- 将 `/actuator/health` 代理到 `127.0.0.1:8080`

## 回滚命令

后端回滚：
```bash
sudo /app/kb/deploy/linux/rollback_backend.sh
```

parser worker 回滚：
```bash
sudo /app/kb/deploy/linux/rollback_parser_worker.sh
```

前端回滚：
```bash
sudo /app/kb/deploy/linux/rollback_frontend.sh
```