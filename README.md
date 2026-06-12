# DaxPay Admin - 支付管理后台

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D" alt="Vue 3">
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF" alt="Vite">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6" alt="TypeScript">
  <img src="https://img.shields.io/badge/antdv--next-4.x-4FC08D" alt="antdv-next">
  <img src="https://img.shields.io/badge/License-商业授权-red" alt="License">
</p>

## 项目简介

DaxPay Admin 是 DaxPay 4.0 商业支付系统的管理后台前端，基于 Vue Vben Admin 5.0 进行二次开发。提供商户管理、服务商管理、代理商管理、支付通道配置、风控管理、系统管理等功能，支持中英文国际化。

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
daxpay4-web/
├── apps/
│   └── daxpay-admin/                    # 管理后台应用
│       └── src/
│           ├── adapter/                 # 适配器（组件适配、表单适配）
│           ├── api/                     # API接口层
│           │   ├── core/                # 核心接口（auth, dict, menu, user）
│           │   ├── iam/                 # IAM权限接口
│           │   ├── payment/             # 支付业务接口
│           │   ├── risk/                # 风控接口
│           │   └── system/              # 系统管理接口
│           ├── assets/                  # 静态资源（渠道图标等）
│           ├── components/              # 业务组件
│           │   ├── b-upload-image/      # 图片上传
│           │   ├── channel/             # 渠道Logo
│           │   ├── icon-picker/         # 图标选择器
│           │   ├── input-password/      # 密码输入（含强度指示）
│           │   ├── query/               # 查询组件（BQuery）
│           │   └── region/              # 地区级联选择
│           ├── enums/                   # 枚举定义
│           ├── hooks/                   # 自定义Hooks
│           │   ├── useDict.ts           # 字典
│           │   ├── useFormEdit.ts       # 表单编辑
│           │   ├── useMessage.ts        # 消息提示
│           │   ├── usePermission.ts     # 权限
│           │   ├── useTablePage.ts      # 表格页面
│           │   └── useValidate.ts       # 验证
│           ├── layouts/                 # 布局
│           ├── locales/                 # 国际化（en-US / zh-CN）
│           ├── router/                  # 路由
│           ├── store/                   # 状态管理
│           ├── views/                   # 页面视图
│           │   ├── dashboard/           # 仪表盘
│           │   ├── iam/                 # IAM权限管理
│           │   ├── payment/             # 支付业务
│           │   │   ├── agent/           # 代理商
│           │   │   ├── channel/         # 渠道配置
│           │   │   ├── isv/             # 服务商
│           │   │   ├── merchant/        # 商户
│           │   │   └── product/         # 支付产品
│           │   ├── risk/                # 风控
│           │   └── system/              # 系统管理
│           └── utils/                   # 工具函数
│
├── packages/
│   ├── @core/                           # 核心组件包
│   │   ├── base/                        # 基础模块
│   │   │   ├── design/                  # 设计令牌、CSS样式
│   │   │   ├── icons/                   # 图标工具
│   │   │   ├── shared/                  # 通用工具函数
│   │   │   └── typings/                 # TypeScript类型定义
│   │   ├── composables/                 # 组合式函数
│   │   ├── preferences/                 # 偏好设置
│   │   └── ui-kit/                      # UI组件库
│   │       ├── form-ui/                 # 表单组件
│   │       ├── layout-ui/               # 布局组件
│   │       ├── menu-ui/                 # 菜单组件
│   │       ├── popup-ui/                # 弹出层组件
│   │       ├── shadcn-ui/               # Shadcn UI组件
│   │       └── tabs-ui/                 # 标签页组件
│   ├── effects/                         # 功能效果包
│   │   ├── access/                      # 权限控制
│   │   ├── common-ui/                   # 通用业务UI
│   │   ├── hooks/                       # 通用Hooks
│   │   ├── layouts/                     # 布局系统
│   │   ├── plugins/                     # 插件（ECharts、Motion、VXE-Table）
│   │   └── request/                     # HTTP请求封装
│   ├── constants/                       # 全局常量
│   ├── icons/                           # 图标包
│   ├── locales/                         # 国际化基础包
│   ├── preferences/                     # 偏好设置入口
│   ├── stores/                          # Pinia状态管理
│   ├── styles/                          # 全局样式
│   ├── types/                           # 全局类型定义
│   └── utils/                           # 工具函数
│
├── internal/                            # 内部工具
│   ├── lint-configs/                    # 代码规范配置
│   │   ├── commitlint-config/           # 提交规范
│   │   ├── eslint-config/               # ESLint配置
│   │   └── stylelint-config/            # Stylelint配置
│   ├── node-utils/                      # Node工具库
│   ├── tsconfig/                        # TypeScript配置预设
│   └── vite-config/                     # Vite构建配置
│
└── scripts/                             # 脚本
    ├── deploy/                          # Docker部署
    ├── turbo-run/                       # Turbo运行器
    └── vsh/                             # Vben Shell工具
```

## 快速开始

### 环境要求
- Node.js 20.19+ / 22.13+ / 24+
- pnpm 10.x

### 安装与启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd daxpay4-web

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
- **商户管理**: 商户入驻、信息管理、支付产品配置、用户管理
- **服务商管理**: 服务商入驻、对接配置、安全配置、用户管理
- **代理商管理**: 代理商信息、支付产品配置、用户管理
- **渠道配置**: 支付宝、微信、银联商务、拉卡拉通道配置
- **支付产品**: 产品管理与配置

### IAM权限管理
- 菜单管理
- 角色管理
- 用户管理

### 风控管理 (Risk)
- 数据源定义
- 输入参数配置
- 风控模型管理

### 系统管理 (System)
- 字典管理
- 平台配置
- 安全配置
- 文件管理
- 日志管理（登录日志、操作日志）
- 在线用户监控

## 国际化

项目支持中英文国际化，翻译文件按业务模块拆分：

```
locales/langs/
├── en-US/                    # 英文翻译
│   ├── core/                 # 核心翻译
│   ├── iam/                  # IAM模块
│   ├── payment/              # 支付模块
│   ├── risk/                 # 风控模块
│   └── system/               # 系统模块
└── zh-CN/                    # 中文翻译
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
