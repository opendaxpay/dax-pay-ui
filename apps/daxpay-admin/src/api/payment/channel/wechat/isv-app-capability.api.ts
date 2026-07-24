import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信服务商应用支付能力关联 API
 */
export const WechatIsvAppCapabilityApi = {
  /** 查询能力应用关联列表（全局） */
  listAll(): Promise<Result<WechatIsvAppCapability[]>> {
    return defHttp.get({ url: '/admin/wechat/isv-app/capability/list-all' });
  },
  /** 全量保存能力应用关联 */
  saveBatch(data: WechatIsvAppCapabilityBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-app/capability/save-batch', data });
  },
  /** 查询微信服务商支持的支付能力候选 */
  listSupportedCapabilities(): Promise<Result<WechatCapabilityOption[]>> {
    return defHttp.get({ url: '/admin/wechat/isv-app/capability/list-supported-capabilities' });
  },
};

/** 支付能力候选项 */
export interface WechatCapabilityOption {
  code: string;
  name: string;
}

/** 微信服务商应用支付能力关联 */
export interface WechatIsvAppCapability {
  capability?: string;
  wechatIsvAppId?: string;
  appName?: string;
  wxAppId?: string;
  appType?: string;
}

/** 支付能力关联应用单项 */
export interface WechatIsvAppCapabilityItem {
  capability: string;
  wechatIsvAppId: string;
}

/** 支付能力关联应用批量保存参数 */
export interface WechatIsvAppCapabilityBatchParam {
  items: WechatIsvAppCapabilityItem[];
}
