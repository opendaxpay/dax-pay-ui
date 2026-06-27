// 支付渠道卡片展示（本地SVG；渠道列表以目录 API 为准）
export interface PayProviderInfo {
  code: string;
  // SVG 文件名（不含扩展名），与 code 可能不同，如 code=alipay → svgName=ali_pay
  svgName: string;
  name: string;
}

export const PAY_PROVIDER_DISPLAY: PayProviderInfo[] = [
  { code: 'aggregate_pay', svgName: 'aggregate_pay', name: '聚合支付' },
  { code: 'wechat', svgName: 'wechat', name: '微信支付' },
  { code: 'alipay', svgName: 'ali_pay', name: '支付宝' },
  { code: 'union_pay', svgName: 'union_pay', name: '银联' },
  { code: 'visa', svgName: 'visa', name: 'Visa' },
  { code: 'mastercard', svgName: 'mastercard', name: 'Mastercard' },
  { code: 'douyin', svgName: 'douyin_pay', name: '抖音支付' },
];

export function findPayProviderDisplay(code: string) {
  return PAY_PROVIDER_DISPLAY.find((item) => item.code === code);
}

/** 获取支付渠道本地 SVG 的 URL */
export function getProviderSvgUrl(code: string): string | undefined {
  const item = findPayProviderDisplay(code);
  if (!item) {
    return undefined;
  }
  try {
    return new URL(`/src/assets/channel/${item.svgName}.svg`, import.meta.url).href;
  } catch {
    return undefined;
  }
}
