import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 斗拱(汇付天下)服务商密钥配置 API
 */
export const DougongPayConfigApi = {
  /**
   * 查询斗拱服务商密钥配置
   * 平台为唯一服务商，密钥全局唯一
   */
  findConfig(product: string): Promise<Result<DougongIsvKeyConfig>> {
    return defHttp.get({
      url: '/admin/dougong/isv-key-config/find-config',
      params: { product },
    });
  },
  /**
   * 保存斗拱服务商密钥配置
   */
  saveConfig(data: DougongIsvKeyConfig): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/dougong/isv-key-config/save-config',
      data,
    });
  },
};

/** 斗拱服务商密钥配置 */
export interface DougongIsvKeyConfig {
  /** 主键 */
  id?: string;
  /** 产品编码 */
  product?: string;
  /** 服务商系统ID(sysId) */
  sysId?: string;
  /** 产品号(productId) */
  productId?: string;
  /** 商户RSA私钥(PEM) */
  privateKey?: string;
  /** 斗拱RSA公钥(PEM, 回调验签用) */
  dgPublicKey?: string;
}
