# Legacy 候选脚本说明

本目录用于放置后续可能归档的脚本说明。

当前状态：
- 仍属于主流程的脚本继续保留在 `scripts/`
- 主文档和 CI 已不再引用大多数 legacy 候选
- 仍有一组辅助脚本之间保留内部依赖关系

## 需要继续保留在 scripts/ 的脚本

这些脚本仍属于当前支持流程，或被 CI / 主文档直接引用：
- `package_backend.ps1`
- `package_frontend.ps1`
- `package_frontend_wsl.sh`
- `package_parser_worker.ps1`
- `redeploy_backend_docker.ps1`
- `redeploy_frontend_docker.ps1`
- `redeploy_dev_stack.ps1`
- `status_dev_stack.ps1`
- `bootstrap_playwright_wsl.sh`
- `run_playwright_wsl.sh`
- `run_playwright_wsl_host.sh`
- `check_host_linux_backend.ps1`
- `test_backend.ps1`
- `test_parser_worker.ps1`

## 可归档候选

这些脚本已不再属于主发布流程，也不再被主文档或 CI 直接引用。

### A 组：后端环境诊断
- `init_backend_env.ps1`

原因：
- 仍可作为偶发性的人工诊断辅助工具
- 但已不属于 Docker 或 Host Linux 的主发布链

### C 组：后端接口验证辅助脚本
- `api_smoke_test.ps1`
- `api_assert_test.ps1`

原因：
- 对定向诊断仍有价值
- 但在日常流程里，已经被 Playwright 和整栈健康检查覆盖

## 需要成组迁移的候选

这组脚本适合后续一起归档，因为它们彼此之间还存在调用关系。

### B 组：样例数据重建辅助脚本
- `init_db.sh`
- `init_search_stack.ps1`
- `reindex_sample_data.ps1`

原因：
- 适合用于重建演示或样例数据
- 但不属于标准重发路径

当前剩余阻塞点：
- `reindex_sample_data.ps1` 仍依赖 `init_search_stack.ps1`

相关说明：
- `docs/knowledge-base-ddl-and-init.md` 仍会介绍 `scripts/init/` 下的 SQL 资产，这本身没有问题
- 它不影响上面这组 helper 后续归档

## 建议的迁移顺序

当后续准备正式归档时，建议按这个顺序进行：
1. 先迁移 A 组和 C 组
2. 再将 B 组成组迁移
3. 如有需要，在本文件里保留一段简短转向说明，方便追溯历史