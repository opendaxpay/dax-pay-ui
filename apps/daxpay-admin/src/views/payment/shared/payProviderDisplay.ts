// 支付渠道卡片展示（图标/色值；方式列表以目录 API 为准）
export const PAY_PROVIDER_DISPLAY = [
  { code: 'aggregate_pay', icon: 'lucide:layers', color: '#722ed1' },
  { code: 'wechat', icon: 'simple-icons:wechat', color: '#07c160' },
  { code: 'alipay', icon: 'simple-icons:alipay', color: '#1677ff' },
  { code: 'union_pay', icon: 'logos:unionpay', color: '#e60012' },
  { code: 'visa', icon: 'simple-icons:visa', color: '#1a1f71' },
  { code: 'mastercard', icon: 'simple-icons:mastercard', color: '#eb001b' },
] as const;

export function findPayProviderDisplay(code: string) {
  return PAY_PROVIDER_DISPLAY.find((item) => item.code === code);
}
