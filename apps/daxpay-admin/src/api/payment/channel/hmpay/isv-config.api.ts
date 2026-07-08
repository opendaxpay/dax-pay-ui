import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 河马付(杉德)服务商密钥配置 API
 */
export const HmpayPayConfigApi = {
  /**
   * 查询河马付服务商密钥配置
   * 平台为唯一服务商，密钥全局唯一，按环境区分
   */
  findConfig(product: string, sandbox: boolean): Promise<Result<HmpayIsvKeyConfig>> {
    return defHttp.get({
      url: '/admin/hmpay/isv-key-config/find-config',
      params: { product, sandbox },
    });
  },
  /**
   * 保存河马付服务商密钥配置
   */
  saveConfig(data: HmpayIsvKeyConfig): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/hmpay/isv-key-config/save-config',
      data,
    });
  },
};

/** 河马付服务商密钥配置 */
export interface HmpayIsvKeyConfig {
  /** 主键 */
  id?: string;
  /** 产品编码 */
  product?: string;
  /** 杉德代理号(sandAppId) */
  sandAppId?: string;
  /** 商户RSA私钥(PKCS#8 Base64) */
  privateKey?: string;
  /** 杉德RSA公钥(X509 Base64, 回调验签用) */
  publicKey?: string;
  /** 是否沙箱环境 */
  sandbox?: boolean;
}
