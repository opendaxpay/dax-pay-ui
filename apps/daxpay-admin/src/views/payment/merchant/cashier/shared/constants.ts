// 收银台配置类型（与后端 GatewayCashierTypeEnum 对齐）
export const CASHIER_TYPE = {
  H5: 'h5',
  WEB: 'web',
  MINI: 'mini',
} as const;

export type CashierType = (typeof CASHIER_TYPE)[keyof typeof CASHIER_TYPE];

// 支付项解析模式（与后端 CashierItemResolveModeEnum 对齐）
export const RESOLVE_MODE = {
  METHOD: 'method',
  DIRECT: 'direct',
} as const;

export type ResolveMode = (typeof RESOLVE_MODE)[keyof typeof RESOLVE_MODE];

/**
 * 客户端环境
 * clientEnv: 后端 ClientEnvEnum 编码
 * provider: 对应支付渠道(用于 DIRECT 候选过滤；browser 无固定 provider)
 */
export interface ClientEnvConfig {
  clientEnv: string;
  provider?: string;
}

/** H5 五个客户端环境桶 */
export const CASHIER_H5_CLIENT_ENVS: ClientEnvConfig[] = [
  { clientEnv: 'browser' },
  { clientEnv: 'wechat_pay', provider: 'wechat' },
  { clientEnv: 'alipay', provider: 'alipay' },
  { clientEnv: 'union_pay', provider: 'union_pay' },
  { clientEnv: 'douyin', provider: 'douyin' },
];

/** 小程序客户端环境桶（无 browser；含微信/支付宝/云闪付/抖音） */
export const CASHIER_MINI_CLIENT_ENVS: ClientEnvConfig[] = [
  { clientEnv: 'wechat_pay', provider: 'wechat' },
  { clientEnv: 'alipay', provider: 'alipay' },
  { clientEnv: 'union_pay', provider: 'union_pay' },
  { clientEnv: 'douyin', provider: 'douyin' },
];

/** 是否按 clientEnv 分桶（H5 / MINI） */
export function cashierTypeRequiresClientEnv(type: CashierType): boolean {
  return type === CASHIER_TYPE.H5 || type === CASHIER_TYPE.MINI;
}

/** 当前类型对应的 clientEnv 二级列表 */
export function clientEnvsForCashierType(type: CashierType): ClientEnvConfig[] {
  if (type === CASHIER_TYPE.MINI) {
    return CASHIER_MINI_CLIENT_ENVS;
  }
  if (type === CASHIER_TYPE.H5) {
    return CASHIER_H5_CLIENT_ENVS;
  }
  return [];
}

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
