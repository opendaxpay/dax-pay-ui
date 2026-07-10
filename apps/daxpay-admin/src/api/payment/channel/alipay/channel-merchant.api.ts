import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝服务商通道商户 API
 */
export const AlipayIsvChannelMerchantApi = {
  /**
   * 创建支付宝服务商通道商户
   */
  create(data: AlipayIsvChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/isv-channel-merchant/create', data });
  },
  /**
   * 更新应用授权令牌(手动设置/更新, 适用于令牌补充或过期/变更后重新绑定)
   */
  updateAppAuthToken(data: AlipayIsvAppAuthTokenUpdateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/isv-channel-merchant/update-app-auth-token', data });
  },
  /**
   * 生成代运营授权链接(支付宝深链, 可出二维码)
   */
  genAuthUrl(data: AlipayIsvAuthParam): Promise<Result<AlipayIsvAuthUrlResult>> {
    return defHttp.post({ url: '/admin/alipay/isv-channel-merchant/gen-auth-url', data });
  },
  /**
   * 获取代运营授权回调地址(用于支付宝开放平台配置)
   */
  getAuthCallbackUrl(): Promise<Result<string>> {
    return defHttp.get({ url: '/admin/alipay/isv-channel-merchant/auth-callback-url' });
  },
  /**
   * 根据通道商户号查询支付宝服务商通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<AlipayIsvChannelMerchantConfig>> {
    return defHttp.get({
      url: '/admin/alipay/isv-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
};

/**
 * 支付宝直连通道商户 API
 */
export const AlipayDirectChannelMerchantApi = {
  /**
   * 创建支付宝直连通道商户
   */
  create(data: AlipayDirectChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/direct-channel-merchant/create', data });
  },
  /**
   * 根据通道商户号查询支付宝直连通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<AlipayDirectChannelMerchantConfig>> {
    return defHttp.get({
      url: '/admin/alipay/direct-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
};

/**
 * 支付宝服务商通道商户配置
 */
export interface AlipayIsvChannelMerchantConfig extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 关联服务商应用ID(系统主键, 指向 alipay_isv_app.id) */
  isvAppId?: string;
  /** 子商户支付宝识别码(2088开头) */
  alipayUserId?: string;
  /** 应用授权令牌(会过期/刷新) */
  appAuthToken?: string;
}

/**
 * 支付宝直连通道商户配置
 */
export interface AlipayDirectChannelMerchantConfig extends MchEntity {
  /** 通道商户号(系统生成雪花号) */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 支付宝商家唯一识别码(2088开头) */
  alipayUserId?: string;
}

/**
 * 支付宝服务商通道商户创建参数
 */
export interface AlipayIsvChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 服务商应用ID(系统主键) */
  isvAppId: string;
  /** 子商户支付宝用户ID(2088开头) */
  alipayUserId: string;
  /** 应用授权令牌 */
  appAuthToken?: string;
}

/**
 * 支付宝直连通道商户创建参数
 */
export interface AlipayDirectChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 支付宝商家用户ID(2088开头) */
  alipayUserId: string;
}

/**
 * 应用授权令牌更新参数
 */
export interface AlipayIsvAppAuthTokenUpdateParam {
  /** 通道商户号 */
  channelMchNo: string;
  /** 应用授权令牌 */
  appAuthToken: string;
}

/**
 * 代运营授权参数
 */
export interface AlipayIsvAuthParam {
  /** 通道商户号 */
  channelMchNo: string;
  /** 应用授权码(回调换 token 时使用) */
  code?: string;
}

/**
 * 代运营授权链接结果
 */
export interface AlipayIsvAuthUrlResult {
  /** 支付宝代运营授权深链 */
  authUrl?: string;
}
