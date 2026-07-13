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
| `channel/` | 按通道分包（alipay / wechat / …），含 config、manage |
| `config/` | 产品配置、平台级校验等 |
| `develop/` | 开发联调（签名、交易、通道授权） |
| `device/` | 设备（如收款码） |
| `masterdata/` | 支付主数据（通道/产品/能力/提供方） |
| `merchant/` | 商户、应用、门店、路由、通道商户等 |
| `order/` | 订单 |
| `shared/` | 支付域公共 TS 工具（非路由页） |

## 命名规则

| 对象 | 规则 | 示例 |
|---|---|---|
| 路由页面（可挂菜单） | `PascalCase.vue` | `MerchantList.vue` |
| 多词目录 | `kebab-case` | `channel-merchant/`、`third-platform/` |
| 单词目录 | 小写 | `order/`、`user/` |
| 非路由局部组件 | 可用 `kebab-case.vue`，或放 `components/` | `analysis-overview.vue` |
| 工作台 widget | 可沿用 `*.widget.vue` | `notice-list.widget.vue` |

**新代码禁止**：目录使用 `camelCase`（历史如 `system/config/mobileApp` 保留不强制改）。

## 菜单 component 绑定

合法格式：

```text
/{views 下相对路径，目录用 /，文件名无 .vue 后缀}
```

| | 示例 |
|---|---|
| 物理文件 | `views/payment/merchant/info/MerchantList.vue` |
| 菜单 component | `/payment/merchant/info/MerchantList` |
| ✅ 合法 | `/iam/user/UserList` |
| ❌ 禁止 | `views/iam/user/UserList`（旧兼容，勿新增） |
| ❌ 禁止 | `/views/iam/user/UserList` |
| ❌ 禁止 | `iam/user/UserList.vue` |

说明：

- 框架 `normalizeViewPath` 会兼容并剥掉 `/views` 前缀，但**全库统一用 `/` 开头的标准写法**。
- 搬家页面 = 改文件路径 + 改 `iam_perm_menu.component`（种子 SQL + 必要时 `update-datas.sql`），缺一不可。
- 解析入口：`src/router/access.ts`；规范化：`packages/utils/src/helpers/generate-routes-backend.ts`。

## shared / components 放置

| 复用范围 | 放置位置 |
|---|---|
| 跨业务域（iam + payment + system） | `src/components/xxx` |
| 仅 payment 多子域 | `views/payment/shared/`（TS）或同级 `shared/components/`（Vue） |
| 单功能点内部 | 该功能目录下 `components/`，少用多层 `shared` |
| 单通道私有 | `views/payment/channel/{provider}/components/` |

## 与 api / locales 对齐

- 新业务子域：优先 `views`、`api`、`locales` 三段同名对齐（如 `payment/device`）。
- 已知例外（允许，PR 中注明即可）：
  - `api/payment/route` ↔ `views/payment/merchant/route`
  - `api/payment/unipay` 主要服务 `views/payment/develop`
- 国际化：`locales/langs/zh-CN` 与 `en-US` 同步；菜单标题真相源为 `iam_perm_menu.title_cn` / `title_en`（见项目 Agents.md）。

## 新增页面 checklist

1. 选对顶层域与子目录（多词目录用 kebab-case）
2. 路由页使用 `PascalCase.vue`
3. 配置菜单 `component = /{相对 views 路径}`（无 `.vue`）
4. API 落到对应 `src/api/...` 域
5. 补充 `zh-CN` + `en-US` 文案
6. 权限码（若需要）
7. 页头 / 菜单标题 i18n 与菜单 `title_cn`/`title_en` 一致

## 历史包袱（不强制重构）

以下为历史现状，**新代码不要扩大**，全量搬家需单独评估（菜单数据强绑定路径）：

- `_core/`、`profile/` 下部分 kebab 文件名
- `system/config/mobileApp` 等 camelCase 目录
- `payment/channel/**` 较深嵌套（如 `manage/mch/app/tabs`）
- 各通道之间目录结构不完全一致（能力差异导致）

更大规模的结构优化见结构治理阶段 B/C（通道公共件、分发器注册表等），不在本约定强制范围内。
