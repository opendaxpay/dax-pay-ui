import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 随行付(天阙科技)通道商户绑定 API
 */
export const VbillChannelMerchantApi = {
  /**
   * 根据通道商户号查询随行付通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<VbillIsvChannelMerchant>> {
    return defHttp.get({
      url: '/admin/vbill/isv-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 创建随行付通道商户
   */
  create(data: VbillIsvChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/vbill/isv-channel-merchant/create', data });
  },
};

/** 随行付通道商户绑定 */
export interface VbillIsvChannelMerchant {
  /** 主键 */
  id?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 天阙商户号(mno) */
  vbillMchNo?: string;
}

/** 随行付通道商户创建参数 */
export interface VbillIsvChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 天阙商户号(mno) */
  vbillMchNo: string;
}
