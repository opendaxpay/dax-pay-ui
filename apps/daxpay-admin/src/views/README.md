# views 目录约定

运营端页面包约定。动态菜单通过 `component` 字段映射到本目录下的 `.vue` 文件（见 `router/access.ts` + `import.meta.glob`）。

## 顶层域职责

| 目录 | 职责 | 菜单来源 |
|---|---|---|
| `_core/` | 登录、鉴权回调、协议页、403/404/offline | 静态路由（`router/routes/core.ts`） |
| `dashboard/` | 工作台、数据分析 | 动态菜单 |
| `iam/` | 用户、角色、菜单、社交登录配置 | 动态菜单 |
| `payment/` | 支付业务（主体，约 60%+ 页面） | 动态菜单 |
| `system/` | 平台配置、日志、监控、通知、协议 | 动态菜单 |
| `profile/` | 个人中心 | 静态注入 Root |
| `demos/` | 演示页 | 动态菜单（建议权限/环境控制） |

### payment 子域

| 子目录 | 职责 |
|---|---|
| `global/{biz}/` | 跨通道公共业务壳（如 `channel-merchant`、`channel-merchant-global`）；**禁止**放某通道私有表单 |
| `channel/{provider}/` | 单通道实现（密钥、ISV/直连 Manage、App 配置） |
| `merchant/` | 商户主体、应用、门店、凭证、网关配置等 |
| `route/` | 支付路由配置 |
| `device/` | 设备：收款码、`terminal/{system,channel}` |
| `order/` | 订单 |
| `notice/` | 商户通知任务 |
| `record/` | 回调记录等 |
| `risk/` | 风控（黑名单、命中） |
| `masterdata/` | 支付主数据（通道/产品/能力/提供方） |
| `config/` | 产品配置、平台级校验等 |
| `develop/` | 开发联调（签名、交易、通道授权） |
| `shared/` | 支付域公共 TS 工具（非完整业务页） |

分层说明：

- `global/{biz}`：业务入口 / 公共壳（列表、创建、详情分发、跨商户总览）
- `channel/{provider}`：该通道私有实现；由 `global/channel-merchant/detail` 分发加载
- `shared/`：更薄的跨子域工具，不承载完整菜单页

## 命名规则

| 对象 | 规则 | 示例 |
|---|---|---|
| 路由页面（可挂菜单） | `PascalCase.vue` | `MerchantList.vue` |
| 多词目录 | `kebab-case` | `channel-merchant/`、`third-platform/`、`mobile-app/` |
| 单词目录 | 小写 | `order/`、`user/`、`global/` |
| 非路由局部组件 | 可用 `kebab-case.vue`，或放 `components/` | `analysis-overview.vue` |
| 工作台 widget | 可沿用 `*.widget.vue` | `notice-list.widget.vue` |

**新代码禁止**：目录使用 `camelCase`。

## 菜单 component 绑定

合法格式：

```text
/{views 下相对路径，目录用 /，文件名无 .vue 后缀}
```

| | 示例 |
|---|---|
| 物理文件 | `views/payment/merchant/info/MerchantList.vue` |
| 菜单 component | `/payment/merchant/info/MerchantList` |
| ✅ 合法 | `/payment/global/channel-merchant/ChannelMerchantList` |
| ✅ 合法 | `/payment/device/terminal/system/SystemTerminalList` |
| ❌ 禁止 | `views/iam/user/UserList`（旧兼容，勿新增） |
| ❌ 禁止 | `/views/iam/user/UserList` |
| ❌ 禁止 | `iam/user/UserList.vue` |

说明：

- 框架 `normalizeViewPath` 会兼容并剥掉 `/views` 前缀，但**全库统一用 `/` 开头的标准写法**。
- 搬家页面 = 改文件路径 + 改 `iam_perm_menu.component`（种子 SQL + 必要时 `update-datas.sql`），缺一不可。
- 解析入口：`src/router/access.ts`；规范化：`packages/utils/src/helpers/generate-routes-backend.ts`。

## shared / components / global 放置

| 复用范围 | 放置位置 |
|---|---|
| 跨业务域（iam + payment + system） | `src/components/xxx` |
| 跨通道的完整业务壳（列表/分发） | `views/payment/global/{biz}/` |
| 仅 payment 多子域、非菜单页工具 | `views/payment/shared/` |
| 单功能点内部 | 该功能目录下 `components/`，少用多层 `shared` |
| 单通道私有 | `views/payment/channel/{provider}/components/` |

## 与 api / locales 对齐

- 新业务子域：优先 `views`、`api`、`locales` 三段同名对齐（如 `payment/device`、`payment/global/channel-merchant`）。
- 已知例外（允许，PR 中注明即可）：
  - `api/payment/unipay` 主要服务 `views/payment/develop`
  - locales 文件名多为 camelCase（跟 i18n key），不必与目录 kebab 一一对应；本轮不强制搬 locales
- 菜单标题真相源：`iam_perm_menu.i18n_key` + `locales/menu-titles/{locale}.json`（见项目 Agents.md）

## 新增页面 checklist

1. 选对顶层域与子目录（多词目录用 kebab-case；公共壳进 `global/{biz}`）
2. 路由页使用 `PascalCase.vue`
3. 配置菜单 `component = /{相对 views 路径}`（无 `.vue`）
4. API 落到对应 `src/api/...` 域
5. 补充语种文案（至少 zh-CN / en-US；管理端按 Agents 要求同步）
6. 权限码（若需要）
7. 页头 / 菜单标题 i18n 与菜单 `i18n_key` 文案一致

## 历史包袱（不强制重构）

以下为历史现状，**新代码不要扩大**，全量搬家需单独评估（菜单数据强绑定路径）：

- `_core/`、`profile/` 下部分 kebab 文件名
- `payment/channel/**` 较深嵌套（如 `manage/mch/app/tabs`）
- 各通道之间目录结构不完全一致（能力差异导致）

更大规模的结构优化见结构治理阶段 B/C（通道公共件、分发器注册表等），不在本约定强制范围内。
