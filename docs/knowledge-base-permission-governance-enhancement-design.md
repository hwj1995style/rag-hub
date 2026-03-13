# 权限治理增强设计方案

## 1. 背景与现状

当前项目已经具备以下权限能力：
- 登录认证与 JWT
- 角色级鉴权
- 文档级资源权限生效（document detail / chunks / search / QA）
- 策略绑定、单条删除、按资源加载策略

这意味着“权限是否生效”这件事已经从空白变成了可用状态，但“管理员如何治理、排错、跟进权限”还不够顺手。

目前的主要缺口是：
- 权限页主要以“按资源手工管理”为主，缺少更好的筛选与跳转
- 管理员在文档详情页、搜索页或 QA 页发现问题后，不能快速进入对应资源的权限治理
- 缺少“主体视角”的检索能力，例如某个 role 或 user 当前命中了哪些 document 策略
- 前后端回归用例主要覆盖了“绑定 / 删除 / 生效”，还没有覆盖“筛选 / 跳转 / 排错”

## 2. 目标

本轮“权限治理增强”聚焦于管理体验和可追踪性，不改变已有权限判定语义。

目标包括：
- 支持按“资源视角”和“主体视角”查询策略
- 支持在文档详情页、文档列表页快速跳转到权限治理页
- 支持策略列表的筛选、深链接和 URL 同步
- 让管理员能更容易地回答这类问题：
  - “这个 document 当前有哪些 allow / deny？”
  - “这个 role 当前命中了哪些 document 策略？”
  - “我在业务页面上看到权限异常时，能否一键进入治理界面？”

## 3. 非目标

本次明确不做以下内容：
- 不改 `deny` 优先、默认拒绝、`admin` 放行等排序规则
- 不引入 chunk / task / query log 级单独授权
- 不做策略版本历史或审计日志
- 不做大规模批量授权工具
- 不做 department 主体在认证上下文中的接入改造

## 4. 用户场景

### 4.1 按资源查看当前策略

管理员输入 `resourceType=document` 和 `resourceId=<documentId>` 后，能看到该 document 当前所有策略，包括：
- subject type
- subject value
- effect
- created at

用于快速判断某个文档为什么被 allow 或 deny。

### 4.2 按主体查看命中策略

管理员输入：
- `subjectType=role`
- `subjectValue=viewer`

系统返回所有命中该主体的策略列表，包括关联的 resource type / resource id。

这个能力用于管理员排查“viewer 当前会被哪些文档策略影响”。

### 4.3 从业务页面快速跳转到治理页

管理员在以下场景中可以直接跳转到权限页：
- 在文档列表中看到某个 document
- 在文档详情页中需要检查该文档的策略

跳转后页面自动带上：
- `resourceType=document`
- `resourceId=<documentId>`

### 4.4 删除单条策略后保持管理上下文

管理员在策略列表中删除一条策略后，页面保留当前的查询条件和 URL，方便继续检查同一批策略。

## 5. 交互与产品设计

### 5.1 权限页升级为“治理查询页”

权限页调整为以下三块：
- 查询区：资源维度 + 主体维度筛选
- 结果列表：当前命中策略
- 维护区：单条删除 + 整批覆盖绑定

### 5.2 支持 URL 同步

以下条件同步到 URL query string：
- `resourceType`
- `resourceId`
- `subjectType`
- `subjectValue`
- `effect`

好处：
- 可以直接从其他页面 deep link 到特定管理视图
- 管理员可以复制当前链接给同事复现问题

### 5.3 结果列表字段

建议列表字段包括：
- Policy ID
- Resource type
- Resource ID
- Subject type
- Subject value
- Effect
- Created at
- Actions

其中 Actions 包括：
- Delete
- Open resource governance（当当前是主体视图时可用）

### 5.4 文档页入口

在以下页面为 `admin` 增加“Manage permissions” 入口：
- Documents list
- Document detail

点击后跳转到：
- `/permissions?resourceType=document&resourceId=<documentId>`

## 6. 接口设计

### 6.1 策略列表查询

在现有 `GET /api/permissions` 基础上扩展查询参数，支持：
- `resourceType`
- `resourceId`
- `subjectType`
- `subjectValue`
- `effect`

约束：
- 至少需要提供一组维度：资源维度或主体维度
- 资源维度表示：`resourceType + resourceId`
- 主体维度表示：`subjectType + subjectValue`
- 仅 `admin` 可访问

结果排序建议：
- 默认按 `createdAt desc`

### 6.2 单条删除

继续保留现有 `DELETE /api/permissions/{policyId}`。

行为约束：
- 删除成功后返回 `policyId` 和 `status=deleted`
- 不存在时返回统一业务错误

### 6.3 整批绑定

继续保留 `POST /api/permissions/bind`，作为“对某个资源做整批覆盖”的管理入口。

## 7. 后端设计

### 7.1 Service 分层

在 `PermissionService` 中增加一个更通用的查询方法，例如：
- `listPolicies(resourceType, resourceId, subjectType, subjectValue, effect)`

要点：
- 支持资源维度
- 支持主体维度
- 可选支持 `effect` 过滤

### 7.2 Repository 层

在 `KbPermissionPolicyRepository` 中提供以下能力：
- 按 resource 维度查询
- 按 subject 维度查询
- 按 effect 可选过滤

第一版不强求分页，但查询接口和前端参数应预留进化空间。

## 8. 前端设计

### 8.1 权限页查询表单

查询表单支持以下输入：
- Resource type
- Resource ID
- Subject type
- Subject value
- Effect

交互规则：
- 输入 resourceType/resourceId 后可从“资源视角”查询
- 输入 subjectType/subjectValue 后可从“主体视角”查询
- effect 作为可选筛选
- 查询条件同步到 URL

### 8.2 策略列表交互

结果列表需支持：
- 按当前筛选加载
- 删除单条策略
- 删除成功后自动刷新当前视图
- 当前为主体视图时，支持跳到单个 resource 视图

### 8.3 页面跳转点

在以下页面加入跳转按钮：
- `DocumentsPage`：每行 document 加“Permissions”
- `DocumentDetailPage`：页面头部加“Manage permissions”

### 8.4 空态与错误

前端需要更稳定地表达以下状态：
- 查询无结果：显示明确空态
- 参数不完整：提示至少填写一组维度
- 查询失败：显示页内错误
- 删除失败：保留当前列表并显示错误

## 9. 测试方案

### 9.1 后端集成测试

至少补以下场景：
- admin 可以按 resource 维度查询策略
- admin 可以按 subject 维度查询策略
- subject + effect 组合筛选生效
- 非 admin 访问被拒绝
- 删除单条策略后，查询结果立即变更

### 9.2 前端 Playwright

至少补以下场景：
- 从 document detail 跳转到 permissions page 并自动带入 resource 条件
- admin 可以按 resource 维度查看策略
- admin 可以按 subject 维度查看策略
- admin 删除策略后列表自动刷新

## 10. 落地顺序

推荐分两步实现：

### 第一步
- 扩展 `GET /api/permissions` 的查询能力
- 前端权限页支持 resource / subject 查询与 URL 同步
- 设计明确的空态、错误态和筛选标签

### 第二步
- 文档列表 / 文档详情页接入跳转入口
- Playwright 补齐跳转 + 查询 + 删除回归

## 11. 当前建议

本轮权限治理增强应该聚焦在“更容易查、更容易跳、更容易排错”，而不是继续扩大权限粒度或变更授权语义。

也就是说，下一步最适合的走法是：
- 先把治理入口做对
- 再把管理体验做顺
- 最后才考虑更复杂的权限主体或更细粒度管理
