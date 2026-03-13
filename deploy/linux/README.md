# Host Linux 部署资产目录

本目录存放 `rag-hub` 的 Host Linux 部署脚本和 systemd 资产。

主要文件：
- `deploy_backend.sh`
- `deploy_parser_worker.sh`
- `deploy_frontend.sh`
- `rollback_backend.sh`
- `rollback_parser_worker.sh`
- `rollback_frontend.sh`
- `verify_deployment.sh`
- `systemd/`

主参考文档：
- `../../README.md`
- `../../docs/knowledge-base-deployment-host-linux.md`

适用场景：
- 在 Host Linux 上部署或回滚服务
- 验证 Host Linux 环境
- 检查打包后的 systemd unit