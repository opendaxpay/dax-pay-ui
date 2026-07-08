import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 乐刷通道商户绑定 API
 */
export const LeshuaChannelMerchantApi = {
  /**
   * 根据通道商户号查询乐刷通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<LeshuaIsvChannelMerchant>> {
    return defHttp.get({
      url: '/admin/leshua/isv-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 创建乐刷通道商户
   */
  create(data: LeshuaIsvChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/leshua/isv-channel-merchant/create', data });
  },
};

/** 乐刷通道商户绑定 */
export interface LeshuaIsvChannelMerchant {
  /** 主键 */
  id?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 乐刷商户编号(merchant_id) */
  lsMchNo?: string;
}

/** 乐刷通道商户创建参数 */
export interface LeshuaIsvChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 乐刷商户编号 */
  lsMchNo: string;
}
