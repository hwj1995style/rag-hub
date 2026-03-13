# 运维手册

## 当前推荐运行形态

当前仓库的推荐运行形态为：
- Docker：前端、后端和全部中间件依赖
- Host Linux：前端和后端都可部署到宿主机
- WSL：仅保留给工具链和 Playwright 回归使用

## 常用运维入口

整套 Docker 启动：
```powershell
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env.example up -d
```

仅重发后端：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_backend_docker.ps1
```

仅重发前端：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_frontend_docker.ps1
```

前后端一起重发：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/redeploy_dev_stack.ps1
```

查看整套状态：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/status_dev_stack.ps1
```

## 健康检查入口

- 前端入口：`http://127.0.0.1/`
- 后端健康检查：`http://127.0.0.1:8080/actuator/health`
- 统一 API 入口：`http://127.0.0.1/api/...`

## Docker 运行重点

当前 Docker 栈包括：
- MySQL
- Redis
- MinIO
- Elasticsearch
- Qdrant
- `rag-hub-backend`
- `rag-hub-frontend`
- `rag-hub-parser-worker`
- `nginx`

默认存储模式为 MinIO，当前已验证通过：
- 上传
- 重解析
- 版本激活
- parser-worker 任务完成
- 权限治理与主业务链路联调

## 回归与验收

Playwright 回归统一从 WSL 执行：
```powershell
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/Projects/rag-hub && bash scripts/run_playwright_wsl.sh'
```

最新已验证结果：
- `31 passed`

## 当前不再推荐的方式

以下方式已经退出主流程：
- Windows 宿主机直接运行后端联调
- WSL 作为前端部署方式
- 未经脚本固化的手工重发流程