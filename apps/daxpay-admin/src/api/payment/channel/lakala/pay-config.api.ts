import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 拉卡拉服务商密钥配置 API
 */
export const LakalaPayConfigApi = {
  /**
   * 查询拉卡拉服务商密钥配置
   * 平台为唯一服务商，密钥全局唯一
   */
  findConfig(product: string): Promise<Result<LakalaIsvKeyConfig>> {
    return defHttp.get({ url: '/admin/lakala/isv-key-config/find-config', params: { product } });
  },
  /**
   * 保存拉卡拉服务商密钥配置
   */
  saveConfig(data: LakalaIsvKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/lakala/isv-key-config/save-config', data });
  },
};

/** 拉卡拉服务商密钥配置 */
export interface LakalaIsvKeyConfig {
  /** 主键 */
  id?: string;
  /** 产品编码 */
  product?: string;
  /** 拉卡拉应用编号 */
  lklAppId?: string;
  /** 商户证书序列号 */
  mchSerialNo?: string;
  /** 商户RSA私钥(PEM) */
  privateKey?: string;
  /** 拉卡拉RSA公钥证书(PEM) */
  publicKey?: string;
  /** SM4密钥(进件敏感字段加密用) */
  sm4Key?: string;
  /** 机构代码 */
  orgCode?: string;
}
