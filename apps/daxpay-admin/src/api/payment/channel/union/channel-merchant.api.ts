import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 云闪付(银联 ACP)通道商户 API
 */
export const UnionChannelMerchantApi = {
  /**
   * 创建云闪付通道商户(写入银联商户号 merId, RSA2 三证书由密钥配置单独维护)
   */
  create(data: UnionChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/union/channel-merchant/create', data });
  },
  /**
   * 根据通道商户号查询证书配置
   */
  findKeyConfig(channelMchNo: string, sandbox: boolean = false): Promise<Result<UnionKeyConfig>> {
    return defHttp.get({
      url: '/admin/union/channel-merchant/find-key-config',
      params: { channelMchNo, sandbox },
    });
  },
  /**
   * 保存证书配置
   */
  saveKeyConfig(data: UnionKeyConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/union/channel-merchant/save-key-config', data });
  },
};

/**
 * 云闪付密钥配置(含银联商户号 merId 与 RSA2 三证书)
 */
export interface UnionKeyConfig {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 商户号 */
  mchNo?: string;
  /** 银联商户号(merId, 创建时录入) */
  merId?: string;
  /** 签名类型(银联 ACP 固定 RSA2) */
  signType?: string;
  /** 是否证书签名 */
  certSign?: boolean;
  /** 应用私钥证书(Base64 PKCS12, 加密存储) */
  keyPrivateCert?: string;
  /** 私钥证书密码(加密存储) */
  keyPrivateCertPwd?: string;
  /** 中级证书(Base64 X.509) */
  acpMiddleCert?: string;
  /** 根证书(Base64 X.509) */
  acpRootCert?: string;
  /** 私钥证书是否已配置 */
  keyPrivateCertConfigured?: boolean;
  /** 证书密码是否已配置 */
  keyPrivateCertPwdConfigured?: boolean;
  /** 是否沙箱环境 */
  sandbox?: boolean;
}

/**
 * 云闪付密钥配置保存参数
 */
export interface UnionKeyConfigParam {
  /** 通道商户号(唯一标识) */
  channelMchNo: string;
  /** 是否沙箱环境 */
  sandbox?: boolean;
  /** 银联商户号(merId) */
  merId?: string;
  /** 签名类型 */
  signType?: string;
  /** 是否证书签名 */
  certSign?: boolean;
  /** 应用私钥证书(Base64 PKCS12) */
  keyPrivateCert?: string;
  /** 私钥证书密码 */
  keyPrivateCertPwd?: string;
  /** 中级证书(Base64 X.509) */
  acpMiddleCert?: string;
  /** 根证书(Base64 X.509) */
  acpRootCert?: string;
}

/**
 * 云闪付通道商户创建参数
 */
export interface UnionChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 银联商户号(merId) */
  merId: string;
}
