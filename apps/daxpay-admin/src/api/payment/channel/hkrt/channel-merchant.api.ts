import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 海科融通通道商户绑定 API
 */
export const HkrtChannelMerchantApi = {
  /**
   * 根据通道商户号查询海科融通通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<HkrtIsvChannelMerchant>> {
    return defHttp.get({
      url: '/admin/hkrt/isv-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 创建海科融通通道商户
   */
  create(data: HkrtIsvChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/hkrt/isv-channel-merchant/create', data });
  },
  /** 更新 SAAS 终端号 */
  updatePn(channelMchNo: string, pn: string): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/hkrt/isv-channel-merchant/update-pn',
      params: { channelMchNo, pn },
    });
  },
};

/** 海科融通通道商户绑定 */
export interface HkrtIsvChannelMerchant {
  /** 主键 */
  id?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 海科商户编号 */
  merchNo?: string;
  /** SAAS 终端号 */
  pn?: string;
}

/** 海科融通通道商户创建参数 */
export interface HkrtIsvChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 海科商户编号 */
  merchNo: string;
}
