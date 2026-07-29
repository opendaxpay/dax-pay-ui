# DaxPay Admin - 支付管理后台

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D" alt="Vue 3">
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF" alt="Vite">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6" alt="TypeScript">
  <img src="https://img.shields.io/badge/antdv--next-1.x-4FC08D" alt="antdv-next">
  <img src="https://img.shields.io/badge/License-LGPL--3.0--or--later-green" alt="License">
</p>

## 项目简介

DaxPay UI 是 DaxPay 支付系统的 Web 管理端 monorepo，基于 Vue Vben Admin 5 二次开发，包含运营端 `daxpay-admin` 与商户端 `daxpay-merchant`，文案与菜单标题支持多语。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5 | 前端框架 |
| Vite | 8.x | 构建工具 |
| TypeScript | 5.9 | 开发语言 |
| antdv-next | 4.x | UI组件库（Ant Design Vue Next） |
| Vxe-Table | 最新 | 企业级表格组件 |
| Vben Admin | 5.7 | 中后台模板 |
| Pinia | 3.x | 状态管理 |
| TailwindCSS | 4.x | 原子化CSS |
| pnpm | 10.x | 包管理器 |
| Turbo | 2.x | Monorepo构建 |
| Axios | 最新 | HTTP请求 |

## 项目结构

```
dax-pay-ui/
├── apps/
│   ├── daxpay-admin/                    # 运营管理后台（端口 6999）
│   │   └── src/                         # 结构见下；views 约定见 apps/daxpay-admin/src/views/README.md
│   └── daxpay-merchant/                 # 商户端（端口 7999；CLIENT_CODE=merchant）
│       └── src/
│           ├── api/core|iam|system      # 登录/菜单/个人中心/通知等壳层 API
│           ├── constants/client.ts      # CLIENT_CODE = 'merchant'
│           ├── views/_core/             # 登录 / 鉴权 / fallback
│           ├── views/dashboard/workspace/  # 静态工作台壳（阶段1）
│           ├── views/profile/           # 个人中心
│           └── views/system/notify/     # 通知中心
│
├── packages/                            # Vben 内核与共享包
│   ├── @core/                           # 核心（design / icons / shared / ui-kit）
│   ├── effects/                         # access / layouts / request / plugins…
│   ├── constants/ · icons/ · locales/
│   ├── preferences/ · stores/ · styles/
│   ├── types/ · utils/
│
├── internal/                            # lint / tsconfig / vite-config / node-utils
└── scripts/                             # 构建与部署脚本
```

运营端 `daxpay-admin` 业务目录仍按域划分（`api/payment`、`views/payment/{global,channel,merchant,route,…}` 等），细则见 [`apps/daxpay-admin/src/views/README.md`](apps/daxpay-admin/src/views/README.md)。

**菜单 component 约定**：值为 `/` + `views` 内相对路径（无 `.vue` 后缀），例如 `/payment/merchant/info/MerchantList`。页面目录与命名细则见 [`apps/daxpay-admin/src/views/README.md`](apps/daxpay-admin/src/views/README.md)。

## 快速开始

### 环境要求
- Node.js 22.13+ / 24+
- pnpm 10.x

### 安装与启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd dax-pay-ui

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev:admin      # 运营端 http://localhost:6999
pnpm dev:merchant   # 商户端 http://localhost:7999

# 4. 构建生产版本（turbo build 会扫到各 app）
pnpm build
```

> 商户端登录需运营端已创建的商户用户。

### 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev:admin` | 启动运营端开发服务器（6999） |
| `pnpm dev:merchant` | 启动商户端开发服务器（7999） |
| `pnpm build` | 构建全部应用 |
| `pnpm lint` | 代码检查 |
| `pnpm format` | Prettier格式化 |
| `pnpm check:type` | TypeScript类型检查 |
| `pnpm test:unit` | 单元测试（Vitest） |
| `pnpm clean` | 清理构建产物 |

## 业务模块

### 支付管理 (Payment)
- **商户管理**: 商户列表/工作台、应用、门店、用户、通道商户
- **通道配置**: 支付宝、微信及多家收单通道（ISV / 直连）
- **支付主数据**: 通道、产品、能力、提供方
- **产品配置**: 产品级通道能力与详情分发
- **订单 / 设备 / 开发联调**: 订单查询、收款码设备、签名与交易调试

### IAM 权限管理
- 菜单管理、角色管理、用户管理、社交登录配置

### 系统管理 (System)
- 字典、平台配置（URL/OSS/安全/第三方平台）、日志、在线用户、通知、协议

### 工作台 (Dashboard)
- 运营工作台、数据分析

## 国际化

业务文案在各 app 的 `src/locales/langs/{locale}/`（多语对称）；菜单标题在 `locales/menu-titles/{locale}.json`。

```
apps/daxpay-admin/src/locales/      # 运营端
apps/daxpay-merchant/src/locales/  # 商户端
├── langs/{zh-CN,en-US,zh-TW,...}/   # 业务文案（按域拆分）
└── menu-titles/{locale}.json        # 菜单标题（flat key）
```

## 开发规范

- Vue组件使用Composition API + `<script setup>`
- 使用TypeScript类型定义，ID字段使用String类型
- API接口集中管理，接口声明继承MchEntity或BaseEntity
- 方法声明使用function，不使用箭头函数赋值给变量
- 使用项目封装的useMessage hook，不使用原生message
- 页面调用REST接口时不需要try包裹
- Vue组件script结构：Vue定义/hook导入 → 参数变量 → 方法实现
- 参数注释使用单行注释(//)，函数说明使用多行注释(/** */)

## 许可证

本项目基于 [GNU LGPL v3.0 或更高版本](./LICENSE) 协议开源，同时受[《用户授权使用协议》](./USER-AGREEMENT.txt)约束。在使用前请阅读上述协议，如果不同意请勿进行使用。

---

<p align="center">
  <strong>DaxPay - 让支付更简单</strong>
</p>
