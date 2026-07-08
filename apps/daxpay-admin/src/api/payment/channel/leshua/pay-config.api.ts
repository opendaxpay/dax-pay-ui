import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 乐刷服务商密钥配置 API
 */
export const LeshuaPayConfigApi = {
  /**
   * 查询乐刷服务商密钥配置
   * 平台为唯一服务商，密钥全局唯一，按环境区分
   */
  findConfig(product: string, sandbox: boolean): Promise<Result<LeshuaIsvKeyConfig>> {
    return defHttp.get({ url: '/admin/leshua/isv-key-config/find-config', params: { product, sandbox } });
  },
  /**
   * 保存乐刷服务商密钥配置
   */
  saveConfig(data: LeshuaIsvKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/leshua/isv-key-config/save-config', data });
  },
};

/** 乐刷服务商密钥配置 */
export interface LeshuaIsvKeyConfig {
  /** 主键 */
  id?: string;
  /** 产品编码 */
  product?: string;
  /** 乐刷商户号(merchant_id) */
  lsMchNo?: string;
  /** 交易密钥(tradeKey) */
  tradeKey?: string;
  /** 异步通知密钥(notifyKey) */
  notifyKey?: string;
  /** 签名类型(MD5 / SM3) */
  signType?: string;
  /** 乐刷服务商号(可选) */
  lsIsvNo?: string;
  /** 是否沙箱环境 */
  sandbox?: boolean;
}
