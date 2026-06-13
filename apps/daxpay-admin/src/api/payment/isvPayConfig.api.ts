import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 服务商产品支付配置 API
 * 仅为类型占位，实际功能由 payProductConfig.api.ts 提供
 */
export const IsvProductPayConfigApi = {
  findProductsByIsvNo(_isvNo: string): Promise<Result<IsvProductPayConfigResult[]>> {
    return Promise.resolve({ code: 0, data: [], msg: 'ok' } as any);
  },
  switchEnv(_isvNo: string, _product: string, _sandbox: boolean): Promise<Result<void>> {
    return Promise.resolve({ code: 0, data: undefined, msg: 'ok' } as any);
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
