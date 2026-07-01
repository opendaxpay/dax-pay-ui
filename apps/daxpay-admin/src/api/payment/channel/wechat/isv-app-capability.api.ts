import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

import type { WechatCapabilityOption } from './mch-app-capability.api';

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

/** 微信服务商应用支付能力关联 */
export interface WechatIsvAppCapability {
  /** 支付能力编码 */
  capability?: string;
  /** 关联微信服务商应用ID */
  wechatIsvAppId?: string;
  /** 应用名称(冗余展示) */
  appName?: string;
  /** 微信应用AppId(冗余展示) */
  wxAppId?: string;
  /** 应用类型(冗余展示): official_account/mini_program/mobile_app */
  appType?: string;
}

/** 支付能力关联应用单项 */
export interface WechatIsvAppCapabilityItem {
  /** 支付能力编码 */
  capability: string;
  /** 关联微信服务商应用ID */
  wechatIsvAppId: string;
}

/** 支付能力关联应用批量保存参数 */
export interface WechatIsvAppCapabilityBatchParam {
  /** 支付能力关联应用列表 */
  items: WechatIsvAppCapabilityItem[];
}

// 复用 WechatCapabilityOption 类型（自 mch-app-capability.api）
export type { WechatCapabilityOption };
