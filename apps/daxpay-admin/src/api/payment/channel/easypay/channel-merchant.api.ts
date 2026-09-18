import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 易支付通道商户绑定 API
 */
export const EasyPayChannelMerchantApi = {
  /**
   * 创建易支付通道商户
   */
  create(data: EasyPayChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/easypay/channel-merchant/create',
      data,
    });
  },
};

/**
 * 易支付商户密钥配置 API
 */
export const EasyPayKeyConfigApi = {
  /**
   * 查询易支付商户密钥配置(密钥字段脱敏返回)
   */
  findConfig(channelMchNo: string): Promise<Result<EasyPayKeyConfig>> {
    return defHttp.get({
      url: '/admin/easypay/key-config/find-config',
      params: { channelMchNo },
    });
  },
  /**
   * 保存易支付商户密钥配置
   */
  saveConfig(data: EasyPayKeyConfigParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/easypay/key-config/save-config',
      data,
    });
  },
};

/** 易支付通道商户创建参数(纯建档, 对接配置由密钥配置后置维护) */
export interface EasyPayChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
}

/** 易支付商户密钥配置(查询返回, 密钥字段为脱敏值) */
export interface EasyPayKeyConfig {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 易支付平台网关地址 */
  serverUrl?: string;
  /** 易支付商户ID(pid) */
  partnerId?: string;
  /** 商户私钥(脱敏值) */
  merchantPrivateKey?: string;
  /** 易支付平台公钥(脱敏值) */
  platformPublicKey?: string;
  /** 商户私钥是否已配置 */
  merchantPrivateKeyConfigured?: boolean;
  /** 平台公钥是否已配置 */
  platformPublicKeyConfigured?: boolean;
}

/** 易支付商户密钥配置保存参数 */
export interface EasyPayKeyConfigParam {
  /** 通道商户号 */
  channelMchNo: string;
  /** 易支付平台网关地址(后端去尾斜杠归一) */
  serverUrl?: string;
  /** 易支付商户ID(pid, 同一商户下唯一) */
  partnerId?: string;
  /** 商户私钥(PKCS8 格式; 未修改时由 diffForm 置空, 后端保留原值) */
  merchantPrivateKey?: string;
  /** 易支付平台公钥(未修改时由 diffForm 置空, 后端保留原值) */
  platformPublicKey?: string;
}
