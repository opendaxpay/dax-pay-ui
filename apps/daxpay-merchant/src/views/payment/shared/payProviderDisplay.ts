// 支付渠道卡片展示（本地SVG；渠道列表以目录 API 为准）
import { resolveChannelLogoUrl } from '@daxpay/ui-biz/channel';

export interface PayProviderInfo {
  code: string;
  // SVG 文件名（不含扩展名）；优先与 code 一致
  svgName: string;
}

export const PAY_PROVIDER_DISPLAY: PayProviderInfo[] = [
  { code: 'aggregate_pay', svgName: 'aggregate_pay' },
  { code: 'wechat', svgName: 'wechat' },
  { code: 'alipay', svgName: 'alipay' },
  { code: 'union_pay', svgName: 'union_pay' },
  { code: 'visa', svgName: 'visa' },
  { code: 'mastercard', svgName: 'mastercard' },
  // Stripe 国际信用卡通道
  { code: 'stripe', svgName: 'stripe' },
  { code: 'douyin', svgName: 'douyin_pay' },
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
