import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 随行付(天阙科技)服务商密钥配置 API
 */
export const VbillPayConfigApi = {
  /**
   * 查询随行付服务商密钥配置
   * 平台为唯一服务商，密钥全局唯一
   */
  findConfig(product: string): Promise<Result<VbillIsvKeyConfig>> {
    return defHttp.get({ url: '/admin/vbill/isv-key-config/find-config', params: { product } });
  },
  /**
   * 保存随行付服务商密钥配置
   */
  saveConfig(data: VbillIsvKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/vbill/isv-key-config/save-config', data });
  },
};

/** 随行付服务商密钥配置 */
export interface VbillIsvKeyConfig {
  /** 主键 */
  id?: string;
  /** 产品编码 */
  product?: string;
  /** 天阙合作机构ID(orgId) */
  orgId?: string;
  /** 天阙RSA公钥(X509 Base64, 回调验签用) */
  publicKey?: string;
  /** 商户RSA私钥(PKCS8 Base64, SHA1withRSA签名) */
  privateKey?: string;
  /** 是否沙箱环境 */
  sandbox?: boolean;
}
