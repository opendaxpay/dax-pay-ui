import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 平台支付宝开放平台认证配置 API
 *
 * 凭据同时服务于: 三方登录的支付宝授权登录(iam 模块)、支付场景的通道认证(payment 模块)。
 * 数据 AES-256-GCM 加密存储, 敏感字段(私钥/证书)脱敏返回。
 */
export const PlatformAlipayAuthConfigApi = {
  /**
   * 获取支付宝认证配置(敏感字段脱敏)
   */
  get(): Promise<Result<PlatformAlipayAuthConfig>> {
    return defHttp.get({ url: '/platform/config/alipay-auth/get' });
  },

  /**
   * 更新支付宝认证配置
   * 敏感字段(privateKey/证书)未修改时前端不传(undefined), 后端 NOT_NULL 策略跳过更新。
   */
  update(data: PlatformAlipayAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/alipay-auth/update', data });
  },
};

/**
 * 平台支付宝开放平台认证配置
 */
export interface PlatformAlipayAuthConfig {
  /** 支付宝开放平台应用 appId */
  appId?: string;
  /** 鉴权方式: public_key(公钥模式) / cert(证书模式) */
  authType?: string;
  /** 应用私钥(脱敏返回, 编辑时未修改不传) */
  privateKey?: string;
  /** 支付宝公钥(公钥模式, 脱敏返回) */
  alipayPublicKey?: string;
  /** 应用公钥证书内容(证书模式, 脱敏返回) */
  appCert?: string;
  /** 支付宝公钥证书内容(证书模式, 脱敏返回) */
  alipayCert?: string;
  /** 支付宝根证书内容(证书模式, 脱敏返回) */
  alipayRootCert?: string;
  /** 是否沙箱环境(平台级配置已废弃, 固定为 false) */
  sandbox?: boolean;
}
