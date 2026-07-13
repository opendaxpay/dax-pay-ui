# DaxPay Admin - 支付管理后台

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D" alt="Vue 3">
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF" alt="Vite">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6" alt="TypeScript">
  <img src="https://img.shields.io/badge/antdv--next-4.x-4FC08D" alt="antdv-next">
  <img src="https://img.shields.io/badge/License-商业授权-red" alt="License">
</p>

## 项目简介

DaxPay Admin 是 DaxPay 支付系统的运营管理后台前端，基于 Vue Vben Admin 5 二次开发。提供商户管理、支付通道配置、支付主数据、IAM 权限、系统管理、工作台分析等功能，支持中英文国际化。

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
│   └── daxpay-admin/                    # 运营管理后台（当前唯一 app）
│       └── src/
│           ├── adapter/                 # 适配器（组件适配、表单适配）
│           ├── api/                     # API 接口层
│           │   ├── core/                # 核心（auth, dict, menu, user…）
│           │   ├── iam/                 # IAM（perm, social, user…）
│           │   ├── payment/             # 支付业务
│           │   │   ├── channel/         # 各通道接口
│           │   │   ├── config/          # 产品等配置
│           │   │   ├── develop/         # 开发联调
│           │   │   ├── device/          # 设备
│           │   │   ├── masterdata/      # 支付主数据
│           │   │   ├── merchant/        # 商户
│           │   │   ├── order/           # 订单
│           │   │   ├── route/           # 路由配置 API
│           │   │   └── unipay/          # 统一支付联调 API
│           │   └── system/              # 系统管理
│           ├── assets/                  # 静态资源（渠道图标等）
│           ├── components/              # 跨域可复用业务组件
│           ├── enums/                   # 枚举定义
│           ├── hooks/                   # 自定义 Hooks
│           ├── layouts/                 # 布局
│           ├── locales/langs/           # 国际化（en-US / zh-CN）
│           ├── router/                  # 路由（动态菜单 + 静态 core）
│           ├── store/                   # 状态管理
│           ├── views/                   # 页面视图（约定见 views/README.md）
│           │   ├── _core/               # 登录 / 鉴权 / fallback
│           │   ├── dashboard/           # 工作台、数据分析
│           │   ├── demos/               # 演示页
│           │   ├── iam/                 # 用户 / 角色 / 菜单 / 社交
│           │   ├── payment/             # 支付业务（主体）
│           │   │   ├── channel/         # 按通道分包（alipay、wechat…）
│           │   │   ├── config/          # 产品配置等
│           │   │   ├── develop/         # 开发联调
│           │   │   ├── device/          # 设备
│           │   │   ├── masterdata/      # 支付主数据
│           │   │   ├── merchant/        # 商户 / 应用 / 路由等
│           │   │   ├── order/           # 订单
│           │   │   └── shared/          # 支付域 TS 工具（非路由页）
│           │   ├── profile/             # 个人中心
│           │   └── system/              # 系统配置 / 日志 / 监控 / 通知
│           └── utils/                   # 工具函数
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
    ├── deploy/                          # Docker 部署
    ├── turbo-run/                       # Turbo 运行器
    └── vsh/                             # Vben Shell 工具
```

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
pnpm dev:admin

# 4. 构建生产版本
pnpm build:admin
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev:admin` | 启动管理后台开发服务器 |
| `pnpm build:admin` | 构建管理后台生产版本 |
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

项目支持中英文国际化，翻译文件按业务域拆分（`zh-CN` / `en-US` 对称）：

```
apps/daxpay-admin/src/locales/langs/
├── en-US/
│   ├── _core/ · components/ · dashboard/ · demos/
│   ├── hooks/ · iam/ · payment/ · system/
│   ├── common.json · page.json · profile.json · timezone.json
└── zh-CN/
    └── (同上结构)
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

本项目采用商业授权协议

---

<p align="center">
  <strong>DaxPay - 让支付更简单</strong>
</p>
