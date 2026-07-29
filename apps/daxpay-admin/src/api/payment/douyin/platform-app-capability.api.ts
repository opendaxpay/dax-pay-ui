import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 平台抖音应用默认能力绑定 API（按支付产品隔离）
 */
export const DyPlatformAppCapabilityApi = {
  /** 按产品查询能力应用关联列表 */
  listByProduct(product: string): Promise<Result<DyPlatformAppCapability[]>> {
    return defHttp.get({
      url: '/admin/douyin/platform-app-capability/list-by-product',
      params: { product },
    });
  },
  /** 按产品全量保存能力应用关联 */
  saveBatch(data: DyPlatformAppCapabilityBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/platform-app-capability/save-batch', data });
  },
  /** 按产品查询可绑定的支付能力候选 */
  listSupportedCapabilities(product: string): Promise<Result<DyCapabilityOption[]>> {
    return defHttp.get({
      url: '/admin/douyin/platform-app-capability/list-supported-capabilities',
      params: { product },
    });
  },
};

/** 平台能力绑定 */
export interface DyPlatformAppCapability {
  /** 支付产品编码 */
  product?: string;
  /** 支付能力编码 */
  capability?: string;
  /** 平台应用ID */
  dyPlatformAppId?: string;
  /** 应用名称(冗余展示) */
  appName?: string;
  /** 抖音应用AppId(冗余展示) */
  douyinAppId?: string;
  /** 应用类型(冗余展示) */
  appType?: string;
}

/** 能力绑定单项 */
export interface DyPlatformAppCapabilityItem {
  capability: string;
  dyPlatformAppId: string;
}

/** 批量保存参数 */
export interface DyPlatformAppCapabilityBatchParam {
  /** 支付产品编码 */
  product: string;
  items: DyPlatformAppCapabilityItem[];
}

/** 支付能力选项 */
export interface DyCapabilityOption {
  code: string;
  name: string;
}
