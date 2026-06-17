import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/** 支付渠道目录 API（平台菜单：分组列表、单条详情；不含通道路由用扁平目录） */
export const PayProviderApi = {
  listByProvider(): Promise<Result<PayProviderGroup[]>> {
    return defHttp.get({ url: '/admin/payment/pay-provider/list-by-provider' });
  },

  get(provider: string, method: string): Promise<Result<PayProviderMethod>> {
    return defHttp.get({
      url: '/admin/payment/pay-provider/get',
      params: { provider, method },
    });
  },

  /** 切换支付渠道启停 */
  switchEnabled(product: string, enabled: boolean): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/payment/pay-provider/switch-enabled', params: { product, enabled } });
  },
};

/** 按支付渠道分组 */
export interface PayProviderGroup {
  provider: string;
  providerLabel?: string;
  icon?: string;
  sortNo?: number;
  enabled?: boolean;
  description?: string;
  methods?: PayProviderMethod[];
}

/** 渠道支付方式行 */
export interface PayProviderMethod {
  provider: string;
  method: string;
  methodLabel?: string;
  sortNo?: number;
  // 目录项说明
  description?: string;
  supportedProducts?: PayProviderProduct[];
}

/** 渠道支付方式支持的支付产品 */
export interface PayProviderProduct {
  label: string;
  value: string;
  channel?: string;
  channelName?: string;
}
