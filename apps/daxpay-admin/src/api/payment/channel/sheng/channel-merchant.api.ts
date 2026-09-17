import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 盛付通通道商户绑定 API
 */
export const ShengChannelMerchantApi = {
  /**
   * 创建盛付通通道商户
   */
  create(data: ShengChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/sheng/channel-merchant/create',
      data,
    });
  },
};

/**
 * 盛付通商户密钥配置 API
 */
export const ShengKeyConfigApi = {
  /**
   * 查询盛付通商户密钥配置(密钥字段脱敏返回)
   */
  findConfig(channelMchNo: string): Promise<Result<ShengKeyConfig>> {
    return defHttp.get({
      url: '/admin/sheng/key-config/find-config',
      params: { channelMchNo },
    });
  },
  /**
   * 保存盛付通商户密钥配置
   */
  saveConfig(data: ShengKeyConfigParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/sheng/key-config/save-config',
      data,
    });
  },
};

/** 盛付通通道商户创建参数 */
export interface ShengChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 盛付通商户号(mchId) */
  shengMchId: string;
}

/** 盛付通商户密钥配置(查询返回, 密钥字段为脱敏值) */
export interface ShengKeyConfig {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 盛付通商户号(mchId) */
  shengMchId?: string;
  /** 盛付通分配的应用ID(sdpAppId) */
  sdpAppId?: string;
  /** 商户私钥(脱敏值) */
  merchantPrivateKey?: string;
  /** 盛付通公钥(脱敏值) */
  shengpayPublicKey?: string;
  /** 商户私钥是否已配置 */
  merchantPrivateKeyConfigured?: boolean;
  /** 盛付通公钥是否已配置 */
  shengpayPublicKeyConfigured?: boolean;
}

/** 盛付通商户密钥配置保存参数 */
export interface ShengKeyConfigParam {
  /** 通道商户号 */
  channelMchNo: string;
  /** 盛付通商户号(mchId, 创建时录入, 不可修改) */
  shengMchId?: string;
  /** 盛付通分配的应用ID(sdpAppId) */
  sdpAppId?: string;
  /** 商户私钥(PEM格式; 未修改时由 diffForm 置空, 后端保留原值) */
  merchantPrivateKey?: string;
  /** 盛付通公钥(PEM格式; 未修改时由 diffForm 置空, 后端保留原值) */
  shengpayPublicKey?: string;
}
