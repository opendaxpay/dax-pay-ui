/**
 * 支付渠道枚举
 *
 * 对齐后端 PayProviderEnum, 表达付款方使用的钱包或支付渠道(C 端视角), 非支付通道。
 * 字典: pay_provider
 */
export enum ProviderEnum {
  /** 聚合支付(收银台/一码多付等) */
  AGGREGATE_PAY = 'aggregate_pay',
  /** 微信(C 端钱包渠道) */
  WECHAT = 'wechat',
  /** 支付宝 */
  ALIPAY = 'alipay',
  /** 银联 */
  UNION_PAY = 'union_pay',
  /** Visa 卡组织 */
  VISA = 'visa',
  /** 万事达卡组织 */
  MASTERCARD = 'mastercard',
  /** 抖音支付 */
  DOUYIN = 'douyin',
}

/**
 * 支付渠道国际化Key映射
 *
 * 用于支付渠道分布报表等"按用户付款方式统计"的场景,
 * 与支付通道 channelEnum(系统对接通道) 区分。
 */
export const providerI18nMap: Record<string, string> = {
  [ProviderEnum.AGGREGATE_PAY]: 'payment.provider.common.aggregatePay',
  [ProviderEnum.WECHAT]: 'payment.provider.common.wechat',
  [ProviderEnum.ALIPAY]: 'payment.provider.common.alipay',
  [ProviderEnum.UNION_PAY]: 'payment.provider.common.unionPay',
  [ProviderEnum.VISA]: 'payment.provider.common.visa',
  [ProviderEnum.MASTERCARD]: 'payment.provider.common.mastercard',
  [ProviderEnum.DOUYIN]: 'payment.provider.common.douyin',
};

/**
 * 支付渠道默认名称映射(降级用, 正常走 i18n)
 */
export const providerNameMap: Record<string, string> = {
  [ProviderEnum.AGGREGATE_PAY]: '聚合支付',
  [ProviderEnum.WECHAT]: '微信支付',
  [ProviderEnum.ALIPAY]: '支付宝',
  [ProviderEnum.UNION_PAY]: '银联支付',
  [ProviderEnum.VISA]: 'Visa',
  [ProviderEnum.MASTERCARD]: '万事达',
  [ProviderEnum.DOUYIN]: '抖音支付',
};
