// 聚合扫码配置深度（与后端 AggregateConfigLevelEnum 对齐）
export const AGGREGATE_LEVEL = {
  AUTO: 'auto',
  METHOD: 'method',
  DIRECT: 'direct',
} as const;

export type AggregateLevel = (typeof AGGREGATE_LEVEL)[keyof typeof AGGREGATE_LEVEL];

/**
 * 聚合扫码场景定义
 * scene: 后端 CashierSceneEnum 编码
 * provider: 对应的支付渠道（PayProviderEnum），用于过滤支付方式候选
 * defaultMethod: L1 自动推导的默认支付方式（与后端 SceneMethodDefaultResolver 对齐）
 */
export interface AggregateSceneConfig {
  scene: string;
  provider: string;
  defaultMethod: string;
}

export const AGGREGATE_SCENES: AggregateSceneConfig[] = [
  { scene: 'wechat_pay', provider: 'wechat', defaultMethod: 'wechat_jsapi' },
  { scene: 'alipay', provider: 'alipay', defaultMethod: 'alipay_jsapi' },
  { scene: 'union_pay', provider: 'union_pay', defaultMethod: 'union_jsapi' },
  { scene: 'douyin', provider: 'douyin', defaultMethod: 'douyin_jsapi' },
];

// 模式显示名
export const LEVEL_DISPLAY: Record<AggregateLevel, string> = {
  auto: '自动模式',
  method: '方式模式',
  direct: '精确模式',
};
