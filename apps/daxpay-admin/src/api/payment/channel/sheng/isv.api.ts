import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 盛付通(服务商模式)子商户绑定 API
 * 服务商密钥为产品级全局配置(见 ShengIsvKeyConfigApi), 通道商户维度仅绑定子商户身份
 */
export const ShengIsvChannelMerchantApi = {
  /**
   * 查询盛付通(服务商)通道商户子商户绑定信息(按通道商户号)
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<ShengIsvChannelMerchantResult>> {
    return defHttp.get({
      url: '/admin/sheng/isv-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 创建盛付通(服务商)通道商户(子商户绑定)
   */
  create(data: ShengIsvChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/sheng/isv-channel-merchant/create',
      data,
    });
  },
};

/**
 * 盛付通(服务商模式)服务商密钥配置 API
 * 服务商密钥产品级全局一份(不区分通道商户), 按 product='sheng_isv' 定位
 */
export const ShengIsvKeyConfigApi = {
  /**
   * 查询盛付通服务商密钥配置(密钥字段脱敏返回)
   */
  findConfig(product: string): Promise<Result<ShengIsvKeyConfig>> {
    return defHttp.get({
      url: '/admin/sheng/isv-key-config/find-config',
      params: { product },
    });
  },
  /**
   * 保存盛付通服务商密钥配置
   */
  saveConfig(data: ShengIsvKeyConfigParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/sheng/isv-key-config/save-config',
      data,
    });
  },
};

/** 盛付通(服务商)通道商户创建参数 */
export interface ShengIsvChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品(固定 sheng_isv) */
  product: string;
  /** 子商户号(服务商代子商户发起交易, 必填) */
  subMchId: string;
  /** 盛付通分配的应用ID(sdpAppId, 可空) */
  sdpAppId?: string;
}

/** 盛付通(服务商)通道商户子商户绑定信息(查询返回) */
export interface ShengIsvChannelMerchantResult {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 子商户号(服务商代子商户发起交易) */
  subMchId?: string;
  /** 盛付通分配的应用ID(sdpAppId) */
  sdpAppId?: string;
}

/** 盛付通服务商密钥配置(查询返回, 密钥字段为脱敏值) */
export interface ShengIsvKeyConfig {
  /** 所属支付产品 */
  product?: string;
  /** 服务商盛付通商户号 */
  shengMchId?: string;
  /** 服务商RSA私钥(脱敏值) */
  merchantPrivateKey?: string;
  /** 盛付通公钥(脱敏值) */
  shengpayPublicKey?: string;
  /** 服务商私钥是否已配置 */
  merchantPrivateKeyConfigured?: boolean;
  /** 盛付通公钥是否已配置 */
  shengpayPublicKeyConfigured?: boolean;
}

/** 盛付通服务商密钥配置保存参数 */
export interface ShengIsvKeyConfigParam {
  /** 所属支付产品(固定 sheng_isv) */
  product: string;
  /** 服务商盛付通商户号 */
  shengMchId?: string;
  /** 服务商RSA私钥(PEM格式; 未修改时由 diffForm 置空, 后端保留原值) */
  merchantPrivateKey?: string;
  /** 盛付通公钥(PEM格式; 未修改时由 diffForm 置空, 后端保留原值) */
  shengpayPublicKey?: string;
}
