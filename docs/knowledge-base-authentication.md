# rag-hub 认证与鉴权说明

## 1. 当前实现范围

当前后端已实现一版最小可用的认证鉴权能力，包括：

- Spring Security 接入
- 用户名密码登录
- Bearer JWT 签发与校验
- 全局未登录拦截
- 管理写接口的 `admin` 角色鉴权

当前还未实现：

- 资源级权限策略对文档读取、搜索、问答结果的过滤
- refresh token
- 登出黑名单
- 多端会话管理

## 2. 登录接口

接口：`POST /api/auth/login`

请求体：

```json
{
  "username": "admin",
  "password": "ChangeMe123!"
}
```

成功响应中的 `data` 结构：

```json
{
  "tokenType": "Bearer",
  "accessToken": "<jwt>",
  "expiresInSeconds": 7200,
  "user": {
    "userId": "uuid",
    "username": "admin",
    "displayName": "Local Admin",
    "roleCode": "admin"
  }
}
```

失败响应：

- 缺少必要参数：`400 / KB-40001`
- 用户名或密码错误：`401 / KB-40102`
- 账号状态非 `active`：`401 / KB-40102`

## 3. Token 使用方式

业务接口需要在请求头中传递：

```http
Authorization: Bearer <jwt>
```

当前公开接口：

- `POST /api/auth/login`
- `GET /actuator/health`
- `GET /actuator/info`
- `/h2-console/**` 仅用于本地开发调试

其余 `/api/**` 默认都要求认证。

## 4. 角色鉴权范围

已接入 `admin` 角色限制的接口：

- `POST /api/documents/upload`
- `POST /api/documents/batch-import`
- `POST /api/documents/{documentId}/reparse`
- `POST /api/documents/{documentId}/versions/{versionId}/activate`
- `POST /api/permissions/bind`

当前仅要求登录、不区分角色的接口：

- `GET /api/documents`
- `GET /api/documents/{documentId}`
- `GET /api/documents/{documentId}/chunks`
- `GET /api/tasks/{taskId}`
- `POST /api/search/query`
- `POST /api/qa/query`
- `GET /api/query-logs/{logId}`
