import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 富友直连通道商户 API（商户移动支付前置接口）
 */
export const FuyouDirectChannelMerchantApi = {
  /**
   * 根据通道商户号查询富友直连通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<FuyouDirectChannelMerchant>> {
    return defHttp.get({
      url: '/admin/fuyou/direct-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 创建富友直连通道商户（免进件，仅登记商户号/终端号）
   */
  create(data: FuyouDirectChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/fuyou/direct-channel-merchant/create', data });
  },
};

/** 富友直连通道商户 */
export interface FuyouDirectChannelMerchant {
  /** 主键 */
  id?: string;
  /** 平台商户号 */
  mchNo?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 富友商户号(mchnt_cd) */
  mchntCd?: string;
  /** 终端号(term_id) */
  termNo?: string;
  /** 是否沙箱环境 */
  sandbox?: boolean;
}

/** 富友直连通道商户创建参数 */
export interface FuyouDirectChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 富友商户号(mchnt_cd) */
  mchntCd: string;
  /** 终端号(term_id) */
  termNo: string;
}
