import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 银联商务直连通道商户 API
 */
export const UmsDirectChannelMerchantApi = {
  /**
   * 创建银联商务直连通道商户(写入商户身份 mid, 应用ID由密钥配置单独维护)
   */
  create(data: UmsDirectChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/ums/direct-channel-merchant/create', data });
  },
  /**
   * 根据通道商户号查询密钥配置
   */
  findKeyConfig(channelMchNo: string, sandbox: boolean = false): Promise<Result<UmsDirectKeyConfig>> {
    return defHttp.get({
      url: '/admin/ums/direct-channel-merchant/find-key-config',
      params: { channelMchNo, sandbox },
    });
  },
  /**
   * 保存密钥配置
   */
  saveKeyConfig(data: UmsDirectKeyConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/ums/direct-channel-merchant/save-key-config', data });
  },
};

/**
 * 银联商务直连密钥配置(含商户身份 mid/tid 与签名密钥)
 */
export interface UmsDirectKeyConfig {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 商户号 */
  mchNo?: string;
  /** 银联商务商户号(mid, 创建时录入) */
  merchantNo?: string;
  /** 终端号(tid) */
  terminalNo?: string;
  /** 银联商务应用 AppId */
  umsAppId?: string;
  /** 应用密钥(HmacSHA256 签名密钥) */
  appKey?: string;
  /** 通讯密钥(回调验签密钥) */
  secretKey?: string;
  /** 应用密钥是否已配置 */
  appKeyConfigured?: boolean;
  /** 通讯密钥是否已配置 */
  secretKeyConfigured?: boolean;
  /** 是否沙箱环境 */
  sandbox?: boolean;
}

/**
 * 银联商务直连密钥配置保存参数
 */
export interface UmsDirectKeyConfigParam {
  /** 通道商户号(唯一标识) */
  channelMchNo: string;
  /** 是否沙箱环境 */
  sandbox?: boolean;
  /** 终端号(tid) */
  terminalNo?: string;
  /** 银联商务应用 AppId */
  umsAppId?: string;
  /** 应用密钥 */
  appKey?: string;
  /** 通讯密钥 */
  secretKey?: string;
}

/**
 * 银联商务直连通道商户创建参数
 */
export interface UmsDirectChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 银联商务商户号(mid) */
  merchantNo: string;
}
