import type { WechatCapabilityOption } from './mch-app-capability.api';

import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信服务商通道商户应用支付能力关联 API
 */
export const WechatIsvMchAppCapabilityApi = {
  /** 查询通道商户的能力应用关联列表 */
  listByChannelMchNo(mchNo: string, channelMchNo: string): Promise<Result<WechatIsvMchAppCapability[]>> {
    return defHttp.get({
      url: '/admin/wechat/isv-mch-app/capability/list-by-channel-mch-no',
      params: { mchNo, channelMchNo },
    });
  },
  /** 全量保存能力应用关联 */
  saveBatch(data: WechatIsvMchAppCapabilityBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-mch-app/capability/save-batch', data });
  },
  /** 查询微信服务商支持的支付能力候选 */
  listSupportedCapabilities(): Promise<Result<WechatCapabilityOption[]>> {
    return defHttp.get({ url: '/admin/wechat/isv-mch-app/capability/list-supported-capabilities' });
  },
};

/** 微信服务商通道商户应用支付能力关联 */
export interface WechatIsvMchAppCapability extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 支付能力编码 */
  capability?: string;
  /** 关联微信服务商通道商户应用ID */
  wechatIsvMchAppId?: string;
  /** 应用名称(冗余展示) */
  appName?: string;
  /** 微信应用AppId(冗余展示) */
  wxAppId?: string;
  /** 应用类型(冗余展示): official_account/mini_program/mobile_app */
  appType?: string;
}

/** 支付能力关联应用单项 */
export interface WechatIsvMchAppCapabilityItem {
  /** 支付能力编码 */
  capability: string;
  /** 关联微信服务商通道商户应用ID */
  wechatIsvMchAppId: string;
}

/** 支付能力关联应用批量保存参数 */
export interface WechatIsvMchAppCapabilityBatchParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户号 */
  channelMchNo: string;
  /** 支付能力关联应用列表(仅含选子商户应用的项,选服务商默认的不传) */
  items: WechatIsvMchAppCapabilityItem[];
}

// 复用 WechatCapabilityOption 类型（自 mch-app-capability.api）
export type { WechatCapabilityOption };
