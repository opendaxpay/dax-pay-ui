// 码牌支付策略配置深度（与后端 AggregateConfigLevelEnum 对齐）
export const CODE_LEVEL = {
  AUTO: 'auto',
  METHOD: 'method',
  DIRECT: 'direct',
} as const;

export type CodeLevel = (typeof CODE_LEVEL)[keyof typeof CODE_LEVEL];

/** 支付形态 h5 / mini */
export const CODE_PAY_FORM = {
  H5: 'h5',
  MINI: 'mini',
} as const;

export type CodePayForm = (typeof CODE_PAY_FORM)[keyof typeof CODE_PAY_FORM];

/**
 * 码牌策略客户端环境
 * defaultMethod: AUTO 展示用，按 payForm 区分
 */
export interface CodeClientEnvMeta {
  clientEnv: string;
  provider: string;
}

export const CODE_CLIENT_ENVS: CodeClientEnvMeta[] = [
  { clientEnv: 'wechat', provider: 'wechat' },
  { clientEnv: 'alipay', provider: 'alipay' },
  { clientEnv: 'union_pay', provider: 'union_pay' },
  { clientEnv: 'douyin', provider: 'douyin' },
];

export const CODE_PAY_FORMS: CodePayForm[] = [CODE_PAY_FORM.H5, CODE_PAY_FORM.MINI];

/** AUTO 默认 method（与后端 CodePayFormEnum#defaultMethodCode 对齐） */
export function defaultMethodFor(clientEnv: string, payForm: CodePayForm): string {
  if (payForm === CODE_PAY_FORM.MINI) {
    if (clientEnv === 'wechat') return 'wechat_mini';
    // 支付宝官方 JSAPI 即小程序场景, 小程序仅走 jsapi
    if (clientEnv === 'alipay') return 'alipay_jsapi';
    if (clientEnv === 'union_pay') return 'union_jsapi';
    if (clientEnv === 'douyin') return 'douyin_jsapi';
  }
  if (clientEnv === 'wechat') return 'wechat_jsapi';
  // 支付宝 H5 默认扫码: 免 OAuth, 预下单返回支付链接
  if (clientEnv === 'alipay') return 'alipay_qr';
  if (clientEnv === 'union_pay') return 'union_jsapi';
  if (clientEnv === 'douyin') return 'douyin_jsapi';
  return '';
}

/** 行键: clientEnv|payForm */
export function rowKey(clientEnv: string, payForm: string): string {
  return `${clientEnv}|${payForm}`;
}
