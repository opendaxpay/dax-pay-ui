import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 平台微信应用默认能力绑定 API（按支付产品隔离）
 */
export const WxPlatformAppCapabilityApi = {
  /** 按产品查询能力应用关联列表 */
  listByProduct(product: string): Promise<Result<WxPlatformAppCapability[]>> {
    return defHttp.get({
      url: '/admin/wx/platform-app-capability/list-by-product',
      params: { product },
    });
  },
  /** 按产品全量保存能力应用关联 */
  saveBatch(data: WxPlatformAppCapabilityBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wx/platform-app-capability/save-batch', data });
  },
  /** 按产品查询可绑定的支付能力候选 */
  listSupportedCapabilities(product: string): Promise<Result<WxCapabilityOption[]>> {
    return defHttp.get({
      url: '/admin/wx/platform-app-capability/list-supported-capabilities',
      params: { product },
    });
  },
};

/** 平台能力绑定 */
export interface WxPlatformAppCapability {
  /** 支付产品编码 */
  product?: string;
  /** 支付能力编码 */
  capability?: string;
  /** 平台应用ID */
  wxPlatformAppId?: string;
  /** 应用名称(冗余展示) */
  appName?: string;
  /** 微信应用AppId(冗余展示) */
  wxAppId?: string;
  /** 应用类型(冗余展示) */
  appType?: string;
}

/** 能力绑定单项 */
export interface WxPlatformAppCapabilityItem {
  capability: string;
  wxPlatformAppId: string;
}

/** 批量保存参数 */
export interface WxPlatformAppCapabilityBatchParam {
  /** 支付产品编码 */
  product: string;
  items: WxPlatformAppCapabilityItem[];
}

/** 支付能力选项 */
export interface WxCapabilityOption {
  code: string;
  name: string;
}
