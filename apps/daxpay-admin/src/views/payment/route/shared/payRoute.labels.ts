import { PAY_ROUTE_MODE, type PayRouteMode } from './payRoute.constants';

import { $t } from '@vben/locales';

/** 国际化：支付渠道展示名 */
export function providerLabel(code: string) {
  const key = `payment.merchant.route.route.providers.${code}`;
  const text = $t(key);
  return text === key ? code : text;
}

/** 国际化：路由模式展示名 */
export function modeDisplayName(mode: PayRouteMode) {
  if (mode === PAY_ROUTE_MODE.BASIC) {
    return $t('payment.merchant.route.route.modeBasic');
  }
  return $t('payment.merchant.route.route.modeScene');
}

/** 规范化路由模式 */
export function normalizePayRouteMode(mode?: string): PayRouteMode {
  return mode === PAY_ROUTE_MODE.BASIC ? PAY_ROUTE_MODE.BASIC : PAY_ROUTE_MODE.SCENE;
}
