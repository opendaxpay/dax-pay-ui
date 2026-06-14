import type { PayRouteMode } from './payRoute.constants';

import { $t } from '@vben/locales';

/** 国际化：支付渠道展示名 */
export function providerLabel(code: string) {
  const key = `payment.merchant.route.route.providers.${code}`;
  const text = $t(key);
  return text === key ? code : text;
}

/** 国际化：路由模式展示名 */
export function modeDisplayName(mode: PayRouteMode) {
  if (mode === 'basic') {
    return $t('payment.merchant.route.route.modeBasic');
  }
  return $t('payment.merchant.route.route.modeScene');
}

/** 规范化路由模式（兼容历史 simple → scene） */
export function normalizePayRouteMode(mode?: string): PayRouteMode {
  if (!mode || mode === 'simple') {
    return 'scene';
  }
  return mode as PayRouteMode;
}
