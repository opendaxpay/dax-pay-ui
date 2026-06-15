import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付产品配置 API（管理员全局配置）
 */
export const PayProductConfigApi = {
  /**
   * 全量查询产品配置列表
   */
  listAll(): Promise<Result<PayProductConfigResult[]>> {
    return defHttp.get({ url: '/admin/product-config/list-all' });
  },

  /**
   * 切换产品的生效环境
   */
  switchEnv(product: string, sandbox: boolean): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/product-config/switch-env', params: { product, sandbox } });
  },

  /**
   * 保存产品配置
   */
  save(param: PayProductConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/product-config/save', data: param });
  },
};

/** 产品配置列表项 */
export interface PayProductConfigResult extends BaseEntity {
  /** 产品编码 */
  product?: string;
  /** 产品名称 */
  name?: string;
  /** 通道编码 */
  channel?: string;
  /** 通道名称 */
  channelName?: string;
  /** 是否支持沙箱环境 */
  sandboxSupport?: boolean;
  /** 生效环境: prod/sandbox */
  activeEnv?: string;
  /** 是否已配置参数 */
  configured?: boolean;
}

/** 产品配置保存参数 */
export interface PayProductConfigParam {
  product?: string;
  channel?: string;
  activeEnv?: string;
  configured?: boolean;
  remark?: string;
}

/**
 * 服务商产品支付配置列表项
 * （视图模型，展示服务商在 prod/sandbox 双环境下的配置与启停状态，
 *   与 PayProductConfigResult 相比多出 isvNo 与双环境字段）
 */
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
