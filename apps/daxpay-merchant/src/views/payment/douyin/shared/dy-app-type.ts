/**
 * 抖音应用类型 ↔ 支付能力兼容规则
 *
 * 须与后端 DyAppTypeEnum.CAPABILITY_APP_TYPE_MAP / isCompatible 保持一致。
 */

/** 抖音开放应用类型 */
export type DyAppTypeCode = 'mini_program' | 'mobile_app' | 'web_app';

/** 支付能力 → 应用类型（与 DyAppTypeEnum 同步） */
const CAPABILITY_APP_TYPE_MAP: Record<string, DyAppTypeCode> = {
  douyin_jsapi: 'mini_program',
  douyin_app: 'mobile_app',
  douyin_qr: 'web_app',
  douyin_h5: 'web_app',
};

/** 根据支付能力推导所需应用类型；未知能力返回 undefined（不过滤） */
export function resolveDyAppTypeByCapability(capability?: string): DyAppTypeCode | undefined {
  if (!capability) {
    return undefined;
  }
  return CAPABILITY_APP_TYPE_MAP[capability];
}

/** 应用类型与支付能力是否兼容；未知能力视为兼容 */
export function isDyAppCompatible(appType: string | undefined, capability: string): boolean {
  const expected = resolveDyAppTypeByCapability(capability);
  if (!expected) {
    return true;
  }
  return appType === expected;
}
