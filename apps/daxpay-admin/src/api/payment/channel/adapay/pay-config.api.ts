import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * Adapay(汇付天下)服务商密钥配置 API
 */
export const AdapayPayConfigApi = {
  /**
   * 查询Adapay 服务商密钥配置
   * 平台为唯一服务商, 同一环境(生产/沙箱)仅一条配置
   */
  findConfig(sandbox: boolean): Promise<Result<AdapayIsvKeyConfig>> {
    return defHttp.get({
      url: '/admin/adapay/isv-key-config/find-config',
      params: { sandbox },
    });
  },
  /**
   * 保存Adapay 服务商密钥配置
   */
  saveConfig(data: AdapayIsvKeyConfig): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/adapay/isv-key-config/save-config',
      data,
    });
  },
};

/**
 * Adapay 服务商密钥配置
 */
export interface AdapayIsvKeyConfig {
  /** 主键 */
  id?: string;
  /** 服务商号(平台在汇付的服务商/主体编号) */
  isvNo?: string;
  /** Adapay 交易密钥(请求头 Authorization, 脱敏回显) */
  apiKey?: string;
  /** 商户RSA私钥(PKCS#8 Base64, 请求签名, 脱敏回显) */
  privateKey?: string;
  /** Adapay 平台公钥(X509 Base64, 响应验签, 脱敏回显; 为空使用全局默认) */
  publicKey?: string;
  /** 是否沙箱环境 */
  sandbox?: boolean;
}
