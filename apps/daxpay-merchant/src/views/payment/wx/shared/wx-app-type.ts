/**
 * 微信应用类型 ↔ 支付能力兼容规则
 *
 * 须与后端 WxAppTypeEnum.CAPABILITY_APP_TYPE_MAP / isCompatible 保持一致。
 */

/** 微信开放应用类型 */
export type WxAppTypeCode = 'mini_program' | 'mobile_app' | 'official_account';

/** 支付能力 → 兼容应用类型集合(有序, 首个为兜底优先级, 与 WxAppTypeEnum 同步) */
const CAPABILITY_APP_TYPE_MAP: Record<string, WxAppTypeCode[]> = {
  wechat_jsapi: ['official_account'],
  wechat_qr: ['official_account', 'mini_program', 'mobile_app'],
  wechat_h5: ['official_account', 'mobile_app'],
  wechat_barcode: ['official_account', 'mini_program', 'mobile_app'],
  wechat_cashier: ['official_account'],
  wechat_mini: ['mini_program'],
  wechat_app: ['mobile_app'],
};

/** 根据支付能力推导全部兼容应用类型；未知能力返回空数组(不过滤) */
export function resolveWxAppTypeByCapability(capability?: string): WxAppTypeCode[] {
  if (!capability) {
    return [];
  }
  return CAPABILITY_APP_TYPE_MAP[capability] ?? [];
}

/** 应用类型与支付能力是否兼容；未知能力视为兼容 */
export function isWxAppCompatible(appType: string | undefined, capability: string): boolean {
  const expected = resolveWxAppTypeByCapability(capability);
  if (expected.length === 0) {
    return true;
  }
  return expected.includes(appType as WxAppTypeCode);
}
