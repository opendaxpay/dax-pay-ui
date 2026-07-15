// 聚合扫码配置深度（与后端 AggregateConfigLevelEnum 对齐）
export const AGGREGATE_LEVEL = {
  AUTO: 'auto',
  METHOD: 'method',
  DIRECT: 'direct',
} as const;

export type AggregateLevel = (typeof AGGREGATE_LEVEL)[keyof typeof AGGREGATE_LEVEL];

/**
 * 聚合扫码客户端环境定义
 * clientEnv: 后端 ClientEnvEnum 编码
 * provider: 对应的支付渠道（PayProviderEnum），用于过滤支付方式候选
 * defaultMethod: L1 自动推导的默认支付方式（与后端 ClientEnvMethodDefaultResolver 对齐）
 */
export interface AggregateClientEnvConfig {
  clientEnv: string;
  provider: string;
  defaultMethod: string;
}

export const AGGREGATE_CLIENT_ENVS: AggregateClientEnvConfig[] = [
  { clientEnv: 'wechat_pay', provider: 'wechat', defaultMethod: 'wechat_jsapi' },
  { clientEnv: 'alipay', provider: 'alipay', defaultMethod: 'alipay_jsapi' },
  { clientEnv: 'union_pay', provider: 'union_pay', defaultMethod: 'union_jsapi' },
  { clientEnv: 'douyin', provider: 'douyin', defaultMethod: 'douyin_jsapi' },
];

// 模式显示名（与 i18n payment.merchant.route / aggregate 词表对齐；页面优先用 $t）
export const LEVEL_DISPLAY: Record<AggregateLevel, string> = {
  auto: '跟随通道路由',
  method: '指定支付方式',
  direct: '直接指定',
};
