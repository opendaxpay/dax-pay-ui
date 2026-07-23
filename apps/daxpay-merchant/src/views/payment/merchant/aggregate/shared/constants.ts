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
  { clientEnv: 'wechat', provider: 'wechat', defaultMethod: 'wechat_jsapi' },
  // 支付宝 H5 默认扫码: 免 OAuth, 预下单返回支付链接
  { clientEnv: 'alipay', provider: 'alipay', defaultMethod: 'alipay_qr' },
  { clientEnv: 'union_pay', provider: 'union_pay', defaultMethod: 'union_jsapi' },
  { clientEnv: 'douyin', provider: 'douyin', defaultMethod: 'douyin_jsapi' },
];
