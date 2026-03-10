# Nginx 配置说明

## 1. 作用

本目录保存 Host Linux 部署使用的 Nginx 反向代理配置。

## 2. 文件清单

- `kb.conf`

## 3. 功能说明

Nginx 层用于：

- 对外暴露统一 HTTP 入口
- 把 `/api/` 请求反代到 `127.0.0.1:8080`
- 提供轻量级 `/healthz`
- 把 `/actuator/health` 转发到 backend 健康检查
- 统一控制上传大小和代理超时

## 4. 预期行为

- `GET /healthz` 返回 `200 ok`
- `GET /actuator/health` 反代到 backend
- `POST /api/...` 反代到 backend
- 其他路径默认返回 `404`

## 5. 安装示例

```bash
cp /app/kb/deploy/nginx/kb.conf /etc/nginx/conf.d/kb.conf
nginx -t
systemctl enable nginx
systemctl restart nginx
```

## 6. 说明

- 日志写入 `/app/kb/logs/nginx.access.log` 和 `/app/kb/logs/nginx.error.log`
- backend 上游地址是 `127.0.0.1:8080`
- 如果要绑定真实域名，请修改 `server_name`
- 生产环境可继续扩展 TLS、鉴权、限流等配置
