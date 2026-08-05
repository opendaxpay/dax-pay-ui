// 通道路由配置模式（与后端 PayRouteModeEnum 对齐）
export const PAY_ROUTE_MODE = {
  BASIC: 'basic',
  SCENE: 'scene',
} as const;

export type PayRouteMode = (typeof PAY_ROUTE_MODE)[keyof typeof PAY_ROUTE_MODE];

import { PAY_PROVIDER_DISPLAY } from '#/views/payment/shared/payProviderDisplay';

/** 通道路由配置页展示的支付渠道（非平台全量：聚合扫码/微信/支付宝/银联/抖音/国际信用卡，与后端 PayRouteConfigProviders 白名单对齐） */
const ROUTE_PAY_PROVIDER_CODES = [
  'aggregate_pay',
  'wechat',
  'alipay',
  'union_pay',
  'douyin',
  // 国际信用卡(Stripe 通道)
  'visa',
  'mastercard',
] as const;

export const ROUTE_PAY_PROVIDERS = PAY_PROVIDER_DISPLAY.filter((p) =>
  (ROUTE_PAY_PROVIDER_CODES as readonly string[]).includes(p.code),
);

// 卡片样式在此配置；各渠道下支付方式列表来自 PayRouteApi.listMethodDirectoryFlat（DB 已启用目录）
