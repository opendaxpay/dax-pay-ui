import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * Adapay 直连通道商户 API
 */
export const AdapayDirectChannelMerchantApi = {
  /**
   * 创建Adapay 直连通道商户(应用ID/密钥由密钥配置单独维护)
   */
  create(data: AdapayDirectChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/adapay/direct-channel-merchant/create', data });
  },
  /**
   * 根据通道商户号查询密钥配置
   */
  findKeyConfig(channelMchNo: string): Promise<Result<AdapayDirectKeyConfig>> {
    return defHttp.get({
      url: '/admin/adapay/direct-channel-merchant/find-key-config',
      params: { channelMchNo },
    });
  },
  /**
   * 保存密钥配置
   */
  saveKeyConfig(data: AdapayDirectKeyConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/adapay/direct-channel-merchant/save-key-config', data });
  },
};

/**
 * Adapay 直连密钥配置(含应用ID与签名密钥)
 */
export interface AdapayDirectKeyConfig {
  /** 通道商户号 */
  channelMchNo?: string;
  /** Adapay 支付应用 ID */
  adapayAppId?: string;
  /** Adapay API Key(请求头 Authorization, 脱敏回显) */
  apiKey?: string;
  /** 商户 RSA 私钥(PKCS#8 Base64, 请求签名, 脱敏回显) */
  privateKey?: string;
  /** Adapay 平台公钥(X509 Base64, 响应验签, 脱敏回显) */
  publicKey?: string;
  /** API Key 是否已配置 */
  apiKeyConfigured?: boolean;
  /** 私钥是否已配置 */
  privateKeyConfigured?: boolean;
}

/**
 * Adapay 直连密钥配置保存参数
 */
export interface AdapayDirectKeyConfigParam {
  /** 通道商户号(唯一标识) */
  channelMchNo: string;
  /** Adapay 支付应用 ID */
  adapayAppId?: string;
  /** Adapay API Key */
  apiKey?: string;
  /** 商户 RSA 私钥(PKCS#8 Base64) */
  privateKey?: string;
  /** Adapay 平台公钥(X509 Base64, 为空使用全局默认) */
  publicKey?: string;
}

/**
 * Adapay 直连通道商户创建参数
 */
export interface AdapayDirectChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
}
