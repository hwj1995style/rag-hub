# 前端中英文切换设计方案

## 1. 背景

当前前端页面文案以硬编码英文为主，缺少统一的国际化抽象层。随着产品逐步面向中文协作环境和英文回归测试同时存在，前端需要支持中英文切换，并保证以下目标：

- 中文用户可直接切换到中文界面
- 现有 Playwright 回归尽量保持稳定
- 不引入过重的第三方国际化框架，避免显著增加维护成本
- 后续新增页面文案能按统一方式继续扩展

## 2. 目标

第一阶段目标：
- 支持 `en` / `zh-CN` 两种语言
- 提供全局语言切换入口
- 将主要页面和布局文案接入统一翻译函数
- 让 Ant Design 基础 locale 跟随语言切换
- 语言选择持久化到 `localStorage`

## 3. 非目标

本阶段不做：
- 多语言内容从后端下发
- 动态按模块懒加载词典
- ICU MessageFormat 之类复杂格式化
- 日期、数字、时区的完整本地化治理
- query log、接口错误、后端返回 message 的自动翻译

## 4. 设计原则

- 默认语言继续保持英文，保证现有回归基线稳定
- 中英文词典直接保存在仓库内，优先可维护性和可读性
- 使用轻量级自研方案，不新增额外 i18n 依赖
- 页面文案通过统一 `t(key)` 获取，避免继续散落硬编码
- 当前只覆盖前端静态文案；服务端错误信息暂按原样显示

## 5. 技术方案

### 5.1 状态存储

新增 `languageStore`：
- `locale`: `en` | `zh-CN`
- `setLocale(locale)`
- `hydrate()`

持久化规则：
- 使用 `localStorage`
- 默认值为 `en`

### 5.2 词典组织

新增 `frontend/src/i18n/messages.ts`：
- `messages.en`
- `messages['zh-CN']`

key 命名规则：
- `layout.*`
- `login.*`
- `documents.*`
- `documentDetail.*`
- `search.*`
- `qa.*`
- `tasks.*`
- `queryLogs.*`
- `permissions.*`
- `common.*`

### 5.3 使用方式

新增 `useI18n()`：
- 返回 `locale`
- 返回 `setLocale`
- 返回 `t(key, vars?)`

`t()` 行为：
- 优先取当前语言词典
- 当前语言缺失时回退到英文
- 若英文也缺失，则直接返回 key

### 5.4 Ant Design locale

在 `main.tsx` 中接入 `ConfigProvider`：
- `en_US`
- `zh_CN`

这样表格分页、空态、日期选择器等 Ant Design 组件文案也会跟随切换。

## 6. 页面落点

第一阶段接入范围：
- `AppLayout`
- `LoginPage`
- `DocumentsPage`
- `DocumentDetailPage`
- `DocumentChunksPage`
- `SearchPage`
- `QaPage`
- `TasksPage`
- `TaskDetailPage`
- `QueryLogsPage`
- `QueryLogPage`
- `PermissionsPage`
- `NotFoundPage`

同时补充：
- 顶部语言切换按钮
- 登录页语言切换入口

## 7. 部署与联调影响

- Docker / Host Linux 部署方式不需要变更
- 前端重新构建后即可生效
- WSL Playwright 继续保持英文默认语言执行

## 8. 测试方案

需要补充：
- 切换到中文后，顶部导航和登录页标题变化
- 切换后刷新页面，语言仍保持
- 默认英文时现有关键回归保持可通过

## 9. 分阶段实施建议

第一阶段：
- 搭建 i18n 基础设施
- 接入主要页面静态文案
- 增加语言切换入口
- 更新 Playwright 冒烟覆盖

第二阶段：
- 继续细化表单校验提示与空态文案
- 评估是否需要把后端错误码映射到前端本地化提示