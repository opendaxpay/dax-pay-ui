import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 河马付(杉德)通道商户绑定 API
 */
export const HmpayChannelMerchantApi = {
  /**
   * 根据通道商户号查询河马付通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<HmpayIsvChannelMerchant>> {
    return defHttp.get({
      url: '/admin/hmpay/isv-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 创建河马付通道商户
   */
  create(data: HmpayIsvChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/hmpay/isv-channel-merchant/create',
      data,
    });
  },
  /**
   * 更新河马付通道商户可选配置(门店号)
   */
  updateConfig(data: HmpayIsvChannelMerchantUpdateParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/hmpay/isv-channel-merchant/update-config',
      data,
    });
  },
};

/** 河马付通道商户绑定 */
export interface HmpayIsvChannelMerchant {
  /** 主键 */
  id?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 杉德商户号 */
  merchantNo?: string;
  /** 门店号(storeId) */
  storeId?: string;
}

/** 河马付通道商户创建参数 */
export interface HmpayIsvChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 杉德商户号 */
  merchantNo: string;
}

/** 河马付通道商户配置更新参数(门店号) */
export interface HmpayIsvChannelMerchantUpdateParam {
  /** 通道商户号 */
  channelMchNo: string;
  /** 门店号 */
  storeId?: string;
}
