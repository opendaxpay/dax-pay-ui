import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 富友通道商户绑定 API
 */
export const FuyouChannelMerchantApi = {
  /**
   * 根据通道商户号查询富友通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<FuyouIsvChannelMerchant>> {
    return defHttp.get({
      url: '/admin/fuyou/isv-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 创建富友通道商户
   */
  create(data: FuyouIsvChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/fuyou/isv-channel-merchant/create', data });
  },
};

/** 富友通道商户绑定 */
export interface FuyouIsvChannelMerchant {
  /** 主键 */
  id?: string;
  /** 平台商户号 */
  mchNo?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 富友商户号(mchnt_cd) */
  fuyouMchNo?: string;
  /** 终端号(term_id) */
  termNo?: string;
}

/** 富友通道商户创建参数 */
export interface FuyouIsvChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 富友商户号(mchnt_cd) */
  fuyouMchNo: string;
  /** 终端号(term_id) */
  termNo: string;
}
