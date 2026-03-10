# rag-hub 运维手册

## 1. 文档目标

本文档是当前 `rag-hub` 项目的统一运维入口，用于整理：

- 部署路径选择
- 初始化步骤
- 发布流程
- 回滚流程
- 验收与巡检

当前仅保留两条独立部署路径，由用户自行选择：

- Host Linux
- Docker

## 2. 首次部署入口

如果是首次搭建环境，优先阅读：

- [Host Linux 部署文档](./knowledge-base-deployment-host-linux.md)
- [Docker 部署文档](./knowledge-base-deployment-docker.md)

## 3. 完整部署文档

- [Host Linux 部署文档](./knowledge-base-deployment-host-linux.md)
- [Docker 部署文档](./knowledge-base-deployment-docker.md)

## 4. Host Linux 运维入口

### 4.1 环境与配置

- 预检脚本：`deploy/linux/preflight_check.sh`
- 运行时安装：`deploy/linux/install_runtime.sh`
- 环境模板：`deploy/linux/kb.env.template`

### 4.2 发布脚本

- `deploy/linux/deploy_backend.sh`
- `deploy/linux/deploy_parser_worker.sh`

### 4.3 回滚脚本

- `deploy/linux/rollback_backend.sh`
- `deploy/linux/rollback_parser_worker.sh`

### 4.4 验收脚本

- `deploy/linux/verify_deployment.sh`

## 5. Docker 运维入口

主要文件：

- `deploy/docker/docker-compose.yml`
- `deploy/docker/.env.example`
- `deploy/docker/nginx.conf`
- `deploy/docker/README.md`

常用命令：

```bash
cp deploy/docker/.env.example deploy/docker/.env
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env ps
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env down
```

## 6. 发版前检查

发布前建议逐项确认：

- 目标环境配置文件已更新
- backend 包已构建完成
- parser-worker 包已准备完成
- MySQL / Elasticsearch / Qdrant / MinIO 连通性正常
- 需要变更的索引和初始化脚本已确认

## 7. 发布执行

### 7.1 Host Linux

```bash
/app/kb/deploy/linux/deploy_backend.sh
/app/kb/deploy/linux/deploy_parser_worker.sh
```

### 7.2 Docker

```bash
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d
```

## 8. 发布后验收

建议至少验证：

- backend 进程或容器状态正常
- `/actuator/health` 返回 `UP`
- `/api/search/query` 返回成功
- `/api/qa/query` 返回成功
- MySQL、Elasticsearch、Qdrant 状态正常

本地联调相关脚本：

- `scripts/verify_local_stack.ps1`
- `scripts/api_smoke_test.ps1`
- `scripts/api_assert_test.ps1`

## 9. 回滚条件

出现以下情况建议立即回滚：

- backend 无法启动
- parser-worker 连续失败
- 检索主链路不可用
- QA 接口持续失败
- 索引或数据库结构与版本不兼容

## 10. 回滚执行

### 10.1 Host Linux

```bash
/app/kb/deploy/linux/rollback_backend.sh
/app/kb/deploy/linux/rollback_parser_worker.sh
```

### 10.2 Docker

Docker 回滚建议通过镜像版本回退或 compose 文件版本回退执行。

## 11. 发版记录模板

建议记录以下信息：

- 发布日期
- 发布人
- 发布版本
- backend 包版本
- parser-worker 包版本
- 配置变更项
- 验收结果
- 是否执行回滚

## 12. 相关文档

- [实施方案](./knowledge-base-implementation-plan.md)
- [开发指南](./knowledge-base-development-guide.md)
- [API 规范](./knowledge-base-api-spec.md)
- [DDL 与初始化](./knowledge-base-ddl-and-init.md)
