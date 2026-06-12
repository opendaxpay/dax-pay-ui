import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 服务商产品支付配置列表查询 API
 * 详情查询和保存由各通道控制器处理
 */
export const IsvProductPayConfigApi = {
  /**
   * 查询服务商的产品配置列表(合并生产和沙箱)
   */
  findProductsByIsvNo(isvNo: string): Promise<Result<IsvProductPayConfigResult[]>> {
    return defHttp.get({ url: '/admin/isv/product-pay-config/find-products-by-isv-no', params: { isvNo } });
  },

  /**
   * 切换产品的启用环境(互斥)
   */
  switchEnv(isvNo: string, product: string, sandbox: boolean): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/product-pay-config/switch-env', params: { isvNo, product, sandbox } });
  },
};

/** 产品配置列表项 */
export interface IsvProductPayConfigResult extends BaseEntity {
  /** 产品编码 */
  product?: string;
  /** 产品名称 */
  name?: string;
  /** 通道编码 */
  channel?: string;
  /** 通道名称 */
  channelName?: string;
  /** 服务商号 */
  isvNo?: string;
  /** 是否支持沙箱环境 */
  sandboxSupport?: boolean;
  /** 生产环境是否已配置 */
  prodConfigured?: boolean;
  /** 生产环境是否启用 */
  prodEnable?: boolean;
  /** 沙箱环境是否已配置 */
  sandboxConfigured?: boolean;
  /** 沙箱环境是否启用 */
  sandboxEnable?: boolean;
  /** 生效环境: prod/sandbox/none */
  activeEnv?: string;
}
