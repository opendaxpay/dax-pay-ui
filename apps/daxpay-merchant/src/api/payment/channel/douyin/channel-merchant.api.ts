import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 抖音直连通道商户 API（商户端 /mch/douyin/direct-channel-merchant/*）
 *
 * 后端强制 mchNo=PaymentContext，前端不必/不应传跨商户 mchNo。
 */
export const DouyinDirectChannelMerchantApi = {
  /**
   * 根据通道商户号查询抖音直连通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<DouyinDirectChannelMerchantConfig>> {
    return defHttp.get({
      url: '/mch/douyin/direct-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 根据通道商户号查询密钥配置
   */
  findKeyConfig(channelMchNo: string): Promise<Result<DouyinDirectKeyConfig>> {
    return defHttp.get({
      url: '/mch/douyin/direct-channel-merchant/find-key-config',
      params: { channelMchNo },
    });
  },
  /**
   * 保存密钥配置
   */
  saveKeyConfig(data: DouyinDirectKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/douyin/direct-channel-merchant/save-key-config', data });
  },
};

/**
 * 抖音直连通道商户配置
 */
export interface DouyinDirectChannelMerchantConfig extends MchEntity {
  /** 通道商户号(系统生成雪花号) */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 抖音商户号(MCHID) */
  dyMchId?: string;
}

/**
 * 抖音直连密钥配置
 */
export interface DouyinDirectKeyConfig {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 商户号 */
  mchNo?: string;
  /** 商户私钥 */
  merchantPrivateKey?: string;
  /** 商家公钥证书序列号 */
  merchantSerialNumber?: string;
  /** 接口加密密钥 */
  encryptKey?: string;
  /** 私钥是否已配置 */
  privateKeyConfigured?: boolean;
  /** 加密密钥是否已配置 */
  encryptKeyConfigured?: boolean;
}
