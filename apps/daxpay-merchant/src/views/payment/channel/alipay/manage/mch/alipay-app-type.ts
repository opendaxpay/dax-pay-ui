/**
 * 支付宝应用类型 ↔ 支付能力兼容规则
 *
 * 须与后端 AlipayCode.CAPABILITY_APP_TYPE_MAP / isCompatible 保持一致。
 */

/** 支付宝直连应用类型 */
export type AlipayAppTypeCode = 'mini_program' | 'mobile_app' | 'web_app';

/** 支付能力 → 兼容应用类型集合(有序, 首个为兜底优先级, 与后端 AlipayDirectAppTypeCode 同步) */
const CAPABILITY_APP_TYPE_MAP: Record<string, AlipayAppTypeCode[]> = {
  alipay_jsapi: ['mini_program'],
  alipay_app: ['mobile_app'],
  alipay_barcode: ['web_app', 'mini_program', 'mobile_app'],
  alipay_qr: ['web_app', 'mini_program', 'mobile_app'],
  alipay_h5: ['web_app', 'mini_program', 'mobile_app'],
  alipay_pc: ['web_app', 'mini_program', 'mobile_app'],
};

/** 根据支付能力推导全部兼容应用类型；未知能力返回空数组(不过滤) */
export function resolveAlipayAppTypeByCapability(capability?: string): AlipayAppTypeCode[] {
  if (!capability) {
    return [];
  }
  return CAPABILITY_APP_TYPE_MAP[capability] ?? [];
}

/** 应用类型与支付能力是否兼容；未知能力视为兼容 */
export function isAlipayAppCompatible(appType: string | undefined, capability: string): boolean {
  const expected = resolveAlipayAppTypeByCapability(capability);
  if (expected.length === 0) {
    return true;
  }
  return expected.includes(appType as AlipayAppTypeCode);
}
