# rag-hub Backend

## 作用

backend 是 `rag-hub` 的 Spring Boot API 服务。

当前主要负责：
- 文档管理接口
- 搜索接口
- 问答接口
- 任务接口
- 查询日志接口
- 权限治理接口
- JWT 认证与角色鉴权

## 运行模式

当前支持的部署模式：
- Docker
- Host Linux

仓库已不再把 Windows 宿主机直接启动 backend 视为正式运行模式。

## 本地工具链

仓库内置工具：
- `../tools/jdk-17.0.14+7`
- `../tools/apache-maven-3.9.13`

常用脚本：
- `../scripts/test_backend.ps1`
- `../scripts/package_backend.ps1`
- `../scripts/redeploy_backend_docker.ps1`
- `../scripts/status_dev_stack.ps1`

## 推荐流程

### Docker 模式

仅重发后端：
```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/redeploy_backend_docker.ps1
```

查看整套状态：
```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/status_dev_stack.ps1
```

### Host Linux 模式

请参考：
- `../docs/knowledge-base-deployment-host-linux.md`

部署后可用以下命令验收：
```bash
/app/kb/deploy/linux/verify_deployment.sh
```

## 测试

```powershell
powershell -ExecutionPolicy Bypass -File ../scripts/test_backend.ps1 -Clean -MavenGoal test
```

## 健康检查

- `GET /actuator/health`

## CI

CI 定义文件：
- `../.github/workflows/ci.yml`