# rag-hub API 规范

## 1. 文档目标

本文档定义当前 `rag-hub` 的核心 API 契约，包括：

- 接口路径
- 请求与响应结构
- 认证与角色规则
- 常见错误码

## 2. 统一响应结构

```json
{
  "code": "KB-00000",
  "message": "success",
  "traceId": "uuid",
  "data": {}
}
```

## 3. 常见错误码

- `KB-40001`：请求参数错误
- `KB-40101`：需要登录
- `KB-40102`：用户名或密码错误
- `KB-40301`：无权限
- `KB-50006`：服务内部异常

## 4. 认证模型

### 4.1 登录

`POST /api/auth/login`

请求：

```json
{
  "username": "admin",
  "password": "ChangeMe123!"
}
```

响应 `data`：

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

### 4.2 Bearer Token

```http
Authorization: Bearer <jwt>
```

公开接口：

- `POST /api/auth/login`
- `GET /actuator/health`
- `GET /actuator/info`

其余业务 API 默认需要认证。

### 4.3 角色规则

仅 `admin` 可调用的写接口：

- `POST /api/documents/upload`
- `POST /api/documents/batch-import`
- `POST /api/documents/{documentId}/reparse`
- `POST /api/documents/{documentId}/versions/{versionId}/activate`
- `POST /api/permissions/bind`

只要登录即可访问的接口：

- 文档列表、详情、chunks
- 任务查询
- 检索接口
- 问答接口
- query log 查询

说明：资源级权限过滤尚未接入。
