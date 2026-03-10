# Host Linux 部署脚本说明

## 1. 作用

本目录保存 Host Linux 直装部署使用的脚本。

## 2. 文件清单

- `preflight_check.sh`
- `install_runtime.sh`
- `deploy_backend.sh`
- `deploy_parser_worker.sh`
- `rollback_backend.sh`
- `rollback_parser_worker.sh`
- `verify_deployment.sh`
- `kb.env.template`

## 3. 推荐使用顺序

### 3.1 环境预检

```bash
bash deploy/linux/preflight_check.sh
```

### 3.2 安装运行时

```bash
sudo bash deploy/linux/install_runtime.sh
```

### 3.3 发布服务

```bash
sudo /app/kb/deploy/linux/deploy_backend.sh
sudo /app/kb/deploy/linux/deploy_parser_worker.sh
/app/kb/deploy/linux/verify_deployment.sh
```

### 3.4 回滚服务

```bash
sudo /app/kb/deploy/linux/rollback_backend.sh
sudo /app/kb/deploy/linux/rollback_parser_worker.sh
/app/kb/deploy/linux/verify_deployment.sh
```

## 4. 相关文档

- `docs/knowledge-base-deployment-host-linux.md`
- `docs/knowledge-base-ops-handbook.md`
