import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 海科融通服务商密钥配置 API
 */
export const HkrtPayConfigApi = {
  /**
   * 查询海科融通服务商密钥配置
   * 平台为唯一服务商，密钥全局唯一，按环境区分
   */
  findConfig(product: string, sandbox: boolean): Promise<Result<HkrtIsvKeyConfig>> {
    return defHttp.get({ url: '/admin/hkrt/isv-key-config/find-config', params: { product, sandbox } });
  },
  /**
   * 保存海科融通服务商密钥配置
   */
  saveConfig(data: HkrtIsvKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/hkrt/isv-key-config/save-config', data });
  },
};

/** 海科融通服务商密钥配置 */
export interface HkrtIsvKeyConfig {
  /** 主键 */
  id?: string;
  /** 产品编码 */
  product?: string;
  /** 服务商编号 */
  agentNo?: string;
  /** 接入机构标识 */
  accessId?: string;
  /** 签名密钥(MD5 大写签名用) */
  accessKey?: string;
  /** 是否沙箱环境 */
  sandbox?: boolean;
}
