import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝直连通道商户 API（商户端 /mch/alipay/direct-channel-merchant/*）
 *
 * 后端强制 mchNo=PaymentContext，前端不必/不应传跨商户 mchNo。
 */
export const AlipayDirectChannelMerchantApi = {
  /**
   * 根据通道商户号查询支付宝直连通道商户配置（含 alipayUserId）
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<AlipayDirectChannelMerchantConfig>> {
    return defHttp.get({
      url: '/mch/alipay/direct-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
};

/**
 * 支付宝直连通道商户配置
 */
export interface AlipayDirectChannelMerchantConfig {
  /** 商户号 */
  mchNo?: string;
  /** 通道商户号(系统生成雪花号) */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 支付宝商家唯一识别码(2088开头) */
  alipayUserId?: string;
}
