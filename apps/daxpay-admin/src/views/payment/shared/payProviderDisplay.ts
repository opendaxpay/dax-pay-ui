// 支付渠道卡片展示（本地SVG；渠道列表以目录 API 为准）
import { resolveChannelLogoUrl } from '@daxpay/ui-biz/channel';

export interface PayProviderInfo {
  code: string;
  // SVG 文件名（不含扩展名）；优先与 code 一致
  svgName: string;
  name: string;
}

export const PAY_PROVIDER_DISPLAY: PayProviderInfo[] = [
  { code: 'aggregate_pay', svgName: 'aggregate_pay', name: '聚合支付' },
  { code: 'wechat', svgName: 'wechat', name: '微信支付' },
  { code: 'alipay', svgName: 'alipay', name: '支付宝' },
  { code: 'union_pay', svgName: 'union_pay', name: '银联支付' },
  { code: 'visa', svgName: 'visa', name: 'Visa' },
  { code: 'mastercard', svgName: 'mastercard', name: 'Mastercard' },
  // Stripe 国际信用卡通道
  { code: 'stripe', svgName: 'stripe', name: 'Stripe' },
  { code: 'douyin', svgName: 'douyin_pay', name: '抖音支付' },
];

export function findPayProviderDisplay(code: string) {
  return PAY_PROVIDER_DISPLAY.find((item) => item.code === code);
}

/** 获取支付渠道本地 SVG 的 URL（资源在 @daxpay/ui-biz） */
export function getProviderSvgUrl(code: string): string | undefined {
  const item = findPayProviderDisplay(code);
  if (!item) {
    return undefined;
  }
  return resolveChannelLogoUrl(item.svgName);
}
