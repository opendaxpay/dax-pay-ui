import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信直连密钥配置 API（商户端 /mch/wechat/direct-key-config/*）
 *
 * 后端强制 mchNo=PaymentContext，前端不必/不应传跨商户 mchNo。
 */
export const WechatDirectKeyConfigApi = {
  /**
   * 查询密钥配置（不存在后端自动创建空记录）
   */
  findKeyConfig(channelMchNo: string): Promise<Result<WechatDirectKeyConfigResult>> {
    return defHttp.get({
      url: '/mch/wechat/direct-key-config/find-key-config',
      params: { channelMchNo },
    });
  },
  /**
   * 保存密钥配置（仅传修改字段，避免脱敏值回写）
   */
  saveKeyConfig(data: WechatDirectKeyConfigParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/mch/wechat/direct-key-config/save-key-config',
      data,
    });
  },
};

/**
 * 微信直连密钥配置结果（敏感字段脱敏）
 */
export interface WechatDirectKeyConfigResult {
  /** 商户号 */
  mchNo?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** API V3密钥（脱敏） */
  apiKeyV3?: string;
  /** 支付公钥（脱敏） */
  publicKey?: string;
  /** 支付公钥ID */
  publicKeyId?: string;
  /** 商户私钥（脱敏） */
  privateKey?: string;
  /** 商户证书（脱敏） */
  privateCert?: string;
  /** 证书序列号 */
  certSerialNo?: string;
}

/**
 * 微信直连密钥配置保存参数
 */
export interface WechatDirectKeyConfigParam {
  /** 通道商户号 */
  channelMchNo: string;
  /** 商户号（后端强制 PaymentContext，前端可不传） */
  mchNo?: string;
  /** API V3密钥 */
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
