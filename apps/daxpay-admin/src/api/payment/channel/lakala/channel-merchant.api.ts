import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 拉卡拉通道商户绑定 API
 */
export const LakalaChannelMerchantApi = {
  /**
   * 根据通道商户号查询拉卡拉通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<LakalaIsvChannelMerchant>> {
    return defHttp.get({
      url: '/admin/lakala/isv-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 创建拉卡拉通道商户
   */
  create(data: LakalaIsvChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/lakala/isv-channel-merchant/create', data });
  },
};

/** 拉卡拉通道商户绑定 */
export interface LakalaIsvChannelMerchant {
  /** 主键 */
  id?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 拉卡拉商户编号 */
  lakalaMchNo?: string;
  /** 终端号 */
  termNo?: string;
}

/** 拉卡拉通道商户创建参数 */
export interface LakalaIsvChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 拉卡拉商户编号 */
  lakalaMchNo: string;
  /** 终端号 */
  termNo?: string;
}
