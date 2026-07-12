// 收银台配置类型（与后端 GatewayCashierTypeEnum 对齐）
export const CASHIER_TYPE = {
  H5: 'h5',
  WEB: 'web',
} as const;

export type CashierType = (typeof CASHIER_TYPE)[keyof typeof CASHIER_TYPE];

// 支付项解析模式（与后端 CashierItemResolveModeEnum 对齐）
export const RESOLVE_MODE = {
  METHOD: 'method',
  DIRECT: 'direct',
} as const;

export type ResolveMode = (typeof RESOLVE_MODE)[keyof typeof RESOLVE_MODE];

/**
 * H5 终端场景
 * scene: 后端 CashierSceneEnum 编码
 * provider: 对应支付渠道(用于 DIRECT 候选过滤；browser 无固定 provider)
 */
export interface CashierSceneConfig {
  scene: string;
  provider?: string;
}

/** H5 五个终端桶 */
export const CASHIER_H5_SCENES: CashierSceneConfig[] = [
  { scene: 'browser' },
  { scene: 'wechat_pay', provider: 'wechat' },
  { scene: 'alipay', provider: 'alipay' },
  { scene: 'union_pay', provider: 'union_pay' },
  { scene: 'douyin', provider: 'douyin' },
];

/**
 * 图标选项（值与 PayProviderEnum.code 完全对齐）
 * 选支付方式/通道商户时 icon = provider 直接赋值，实现联动
 */
export const CASHIER_ICON_OPTIONS = [
  { value: 'aggregate_pay', labelKey: 'payment.merchant.cashier.cashier.icons.aggregate_pay' },
  { value: 'wechat', labelKey: 'payment.merchant.cashier.cashier.icons.wechat' },
  { value: 'alipay', labelKey: 'payment.merchant.cashier.cashier.icons.alipay' },
  { value: 'union_pay', labelKey: 'payment.merchant.cashier.cashier.icons.union_pay' },
  { value: 'visa', labelKey: 'payment.merchant.cashier.cashier.icons.visa' },
  { value: 'mastercard', labelKey: 'payment.merchant.cashier.cashier.icons.mastercard' },
  { value: 'douyin', labelKey: 'payment.merchant.cashier.cashier.icons.douyin' },
] as const;
