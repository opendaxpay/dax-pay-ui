import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 易宝直连通道商户 API
 */
export const YeepayChannelMerchantApi = {
  /**
   * 创建易宝直连通道商户
   */
  create(data: YeepayDirectChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/yeepay/direct-channel-merchant/create',
      data,
    });
  },
  /**
   * 根据通道商户号查询易宝密钥配置
   */
  findKeyConfig(channelMchNo: string, sandbox: boolean = false): Promise<Result<YeepayDirectKeyConfig>> {
    return defHttp.get({
      url: '/admin/yeepay/direct-channel-merchant/find-key-config',
      params: { channelMchNo, sandbox },
    });
  },
  /**
   * 保存易宝密钥配置
   */
  saveKeyConfig(data: YeepayDirectKeyConfigParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/yeepay/direct-channel-merchant/save-key-config',
      data,
    });
  },
};

/** 易宝直连密钥配置 */
export interface YeepayDirectKeyConfig {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 易宝商户号 */
  merchantNo?: string;
  /** 易宝服务商商编 */
  yopIsvNo?: string;
  /** 通道应用 AppKey */
  appKey?: string;
  /** 商户 RSA 私钥 */
  privateKey?: string;
  /** 易宝平台 RSA 公钥 */
  yopPublicKey?: string;
  /** 微信 AppId */
  wxAppId?: string;
  /** 微信 AppSecret */
  wxAppSecret?: string;
  /** AppKey 是否已配置 */
  appKeyConfigured?: boolean;
  /** 私钥是否已配置 */
  privateKeyConfigured?: boolean;
  /** 公钥是否已配置 */
  yopPublicKeyConfigured?: boolean;
  /** 是否沙箱环境 */
  sandbox?: boolean;
}

/** 易宝直连通道商户创建参数 */
export interface YeepayDirectChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 易宝商户号 */
  merchantNo: string;
  /** 易宝服务商商编 */
  yopIsvNo: string;
}

/** 易宝直连密钥配置保存参数 */
export interface YeepayDirectKeyConfigParam {
  /** 通道商户号 */
  channelMchNo: string;
  /** 是否沙箱环境 */
  sandbox?: boolean;
  /** 通道应用 AppKey */
  appKey?: string;
  /** 商户 RSA 私钥 */
  privateKey?: string;
  /** 易宝平台 RSA 公钥 */
  yopPublicKey?: string;
  /** 微信 AppId */
  wxAppId?: string;
  /** 微信 AppSecret */
  wxAppSecret?: string;
}
