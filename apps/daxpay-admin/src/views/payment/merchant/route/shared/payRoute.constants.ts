// 通道路由配置模式（与后端 PayRouteModeEnum 对齐）
export type PayRouteMode = 'advanced' | 'basic' | 'scene';

// advanced：精细模式预留，管理端仅展示 disabled，不可编辑与设为生效

import { PAY_PROVIDER_DISPLAY } from '#/views/payment/shared/payProviderDisplay';

/** 通道路由配置页展示的支付渠道（非平台全量，仅微信/支付宝/银联） */
const ROUTE_PAY_PROVIDER_CODES = ['wechat', 'alipay', 'union_pay'] as const;

export const ROUTE_PAY_PROVIDERS = PAY_PROVIDER_DISPLAY.filter((p) =>
  (ROUTE_PAY_PROVIDER_CODES as readonly string[]).includes(p.code),
);

// 卡片样式在此配置；各渠道下支付方式列表来自 PayRouteApi.listMethodDirectoryFlat（DB 已启用目录）
