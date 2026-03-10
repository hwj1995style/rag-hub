# rag-hub Backend

## 1. 作用

当前 `backend` 是 `rag-hub` 的 Spring Boot 后端服务，负责：

- 文档管理接口
- 检索接口
- 问答接口
- 查询日志接口
- 权限绑定接口

## 2. 运行配置

当前支持的 profile：

- `default`：H2 内存模式，适合本地快速启动和接口验证
- `prod`：MySQL 生产配置
- `docker`：Docker Compose 环境配置

## 3. 当前技术栈

- 元数据库：MySQL 8.0
- 全文检索：Elasticsearch
- 向量检索：Qdrant
- 对象存储：MinIO

## 4. 本地工具链

仓库内已内置本地工具：

- `tools/jdk-17.0.14+7`
- `tools/apache-maven-3.9.13`

## 5. 常用脚本

- 环境检查：`../scripts/init_backend_env.ps1`
- 测试：`../scripts/test_backend.ps1`
- 启动：`../scripts/run_backend.ps1`
- 打包：`../scripts/package_backend.ps1`
- 一键联调：`../scripts/run_all_local.ps1`
- 状态检查：`../scripts/status_local.ps1`
- 停止联调：`../scripts/stop_all_local.ps1`
- 清理状态：`../scripts/reset_local_state.ps1`
- 样例重建：`../scripts/reindex_sample_data.ps1`
- API 烟雾测试：`../scripts/api_smoke_test.ps1`
- API 严格断言：`../scripts/api_assert_test.ps1`
- 本地统一验收：`../scripts/verify_local_stack.ps1`

## 6. 本地启动

```powershell
../scripts/run_backend.ps1
../scripts/run_backend.ps1 -Profile prod
```

## 7. 运行测试

```powershell
../scripts/test_backend.ps1 -Clean -MavenGoal test
```

## 8. 健康检查

- `GET /actuator/health`

## 9. 推荐联调顺序

```powershell
../scripts/reindex_sample_data.ps1
../scripts/api_smoke_test.ps1
../scripts/api_assert_test.ps1
../scripts/verify_local_stack.ps1
```

## 10. CI

CI 文件：

- `../.github/workflows/ci.yml`

当前 CI 会执行：

- backend Maven 测试
- parser-worker Python 单元测试
- 关键脚本存在性检查
