/**
 * 微信应用类型 ↔ 支付能力兼容规则
 *
 * 须与后端 WxAppTypeEnum.CAPABILITY_APP_TYPE_MAP / isCompatible 保持一致。
 */

/** 微信开放应用类型 */
export type WxAppTypeCode = 'official_account' | 'mini_program' | 'mobile_app';

/** 支付能力 → 应用类型（与 WxAppTypeEnum 同步） */
const CAPABILITY_APP_TYPE_MAP: Record<string, WxAppTypeCode> = {
  wechat_jsapi: 'official_account',
  wechat_qr: 'official_account',
  wechat_h5: 'official_account',
  wechat_barcode: 'official_account',
  wechat_cashier: 'official_account',
  wechat_mini: 'mini_program',
  wechat_app: 'mobile_app',
};

/** 根据支付能力推导所需应用类型；未知能力返回 undefined（不过滤） */
export function resolveWxAppTypeByCapability(capability?: string): WxAppTypeCode | undefined {
  if (!capability) {
    return undefined;
  }
  return CAPABILITY_APP_TYPE_MAP[capability];
}

/** 应用类型与支付能力是否兼容；未知能力视为兼容 */
export function isWxAppCompatible(appType: string | undefined, capability: string): boolean {
  const expected = resolveWxAppTypeByCapability(capability);
  if (!expected) {
    return true;
  }
  return appType === expected;
}
