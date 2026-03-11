# rag-hub Backend

## 1. 作用

当前 `backend` 是 `rag-hub` 的 Spring Boot 后端服务，负责：

- 文档管理接口
- 检索接口
- 问答接口
- 查询日志接口
- 权限绑定接口

## 2. 运行模式

后端当前仅保留以下两种运行/部署模式：

- `docker`：Docker Compose 环境配置
- `prod`：Host Linux 部署配置

`default` / H2 相关配置仅用于测试与开发辅助，不再作为仓库公开的宿主机运行模式。

## 3. 当前技术栈

- 元数据库：MySQL 8.0
- 全文检索：Elasticsearch
- 向量检索：Qdrant
- 对象存储：MinIO 或本地共享目录

## 4. 本地工具链

仓库内已内置本地工具：

- `tools/jdk-17.0.14+7`
- `tools/apache-maven-3.9.13`

## 5. 常用脚本

- 环境检查：`../scripts/init_backend_env.ps1`
- 测试：`../scripts/test_backend.ps1`
- 打包：`../scripts/package_backend.ps1`
- 样例重建：`../scripts/reindex_sample_data.ps1`
- API 烟雾测试：`../scripts/api_smoke_test.ps1`
- API 严格断言：`../scripts/api_assert_test.ps1`

## 6. 推荐工作流

### Docker 模式

```powershell
docker compose -f ../deploy/docker/docker-compose.yml --env-file ../deploy/docker/.env up -d
powershell -ExecutionPolicy Bypass -File ../scripts/api_smoke_test.ps1 -BackendEndpoint http://127.0.0.1:18080
```

### Host Linux 模式

请按 [Host Linux 部署文档](../docs/knowledge-base-deployment-host-linux.md) 完成部署，再使用：

```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/api_smoke_test.ps1 -BackendEndpoint http://<host-linux-ip>:8080
powershell -ExecutionPolicy Bypass -File ../scripts/api_assert_test.ps1 -BackendEndpoint http://<host-linux-ip>:8080
```

## 7. 运行测试

```powershell
../scripts/test_backend.ps1 -Clean -MavenGoal test
```

## 8. 健康检查

- `GET /actuator/health`

## 9. CI

CI 文件：

- `../.github/workflows/ci.yml`

当前 CI 会执行：

- backend Maven 测试
- parser-worker Python 单元测试
- 关键脚本存在性检查
