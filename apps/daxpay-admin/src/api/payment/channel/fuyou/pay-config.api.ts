import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 富友服务商密钥配置 API
 */
export const FuyouPayConfigApi = {
  /**
   * 查询富友服务商密钥配置
   * 平台为唯一服务商，密钥全局唯一，按环境区分
   */
  findConfig(product: string, sandbox: boolean): Promise<Result<FuyouIsvKeyConfig>> {
    return defHttp.get({ url: '/admin/fuyou/isv-key-config/find-config', params: { product, sandbox } });
  },
  /**
   * 保存富友服务商密钥配置
   */
  saveConfig(data: FuyouIsvKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/fuyou/isv-key-config/save-config', data });
  },
};

/** 富友服务商密钥配置 */
export interface FuyouIsvKeyConfig {
  /** 主键 */
  id?: string;
  /** 产品编码 */
  product?: string;
  /** 富友应用编号(机构号 ins_cd) */
  fyAppId?: string;
  /** 富友订单前缀(关联订单号前缀) */
  orderPrefix?: string;
  /** 商户RSA私钥(PKCS8 Base64, 加密存储) */
  privateKey?: string;
  /** 富友RSA公钥(X509 Base64, 加密存储) */
  publicKey?: string;
  /** 是否沙箱环境 */
  sandbox?: boolean;
}
