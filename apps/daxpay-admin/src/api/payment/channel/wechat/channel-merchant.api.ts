import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信服务商通道商户 API
 */
export const WechatIsvChannelMerchantApi = {
  /**
   * 创建微信服务商通道商户
   */
  create(data: WechatIsvChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-channel-merchant/create', data });
  },
  /**
   * 根据通道商户号查询微信服务商通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<WechatIsvChannelMerchantConfig>> {
    return defHttp.get({
      url: '/admin/wechat/isv-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
};

/**
 * 微信直连通道商户 API
 */
export const WechatDirectChannelMerchantApi = {
  /**
   * 创建微信直连通道商户
   */
  create(data: WechatDirectChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/direct-channel-merchant/create', data });
  },
  /**
   * 根据通道商户号查询微信直连通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<WechatDirectChannelMerchantConfig>> {
    return defHttp.get({
      url: '/admin/wechat/direct-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 根据通道商户号查询密钥配置
   */
  findKeyConfig(channelMchNo: string): Promise<Result<WechatDirectKeyConfig>> {
    return defHttp.get({
      url: '/admin/wechat/direct-channel-merchant/find-key-config',
      params: { channelMchNo },
    });
  },
  /**
   * 保存密钥配置
   */
  saveKeyConfig(data: WechatDirectKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/direct-channel-merchant/save-key-config', data });
  },
};

/**
 * 微信服务商通道商户配置
 */
export interface WechatIsvChannelMerchantConfig extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 微信特约商户号/二级商户号 */
  subMchId?: string;
}

/**
 * 微信直连通道商户配置
 */
export interface WechatDirectChannelMerchantConfig extends MchEntity {
  /** 通道商户号(系统生成雪花号) */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 微信直连商户号 */
  wxMchId?: string;
}

/**
 * 微信服务商通道商户创建参数
 */
export interface WechatIsvChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 微信特约商户号/二级商户号 */
  subMchId: string;
}

/**
 * 微信直连密钥配置
 */
export interface WechatDirectKeyConfig {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 商户号 */
  mchNo?: string;
  /** APIv3密钥 */
  apiKeyV3?: string;
  /** 支付公钥 */
  publicKey?: string;
  /** 支付公钥ID */
  publicKeyId?: string;
  /** 商户私钥 */
  privateKey?: string;
  /** 商户证书 */
  privateCert?: string;
  /** 证书序列号 */
  certSerialNo?: string;
}

/**
 * 微信直连通道商户创建参数
 */
export interface WechatDirectChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 微信直连商户号 */
  wxMchId: string;
}
