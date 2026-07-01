import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信直连商户应用支付能力关联 API
 */
export const WechatMchAppCapabilityApi = {
  /** 查询通道商户的能力应用关联列表 */
  listByChannelMchNo(mchNo: string, channelMchNo: string): Promise<Result<WechatMchAppCapability[]>> {
    return defHttp.get({
      url: '/admin/wechat/mch-app/capability/list-by-channel-mch-no',
      params: { mchNo, channelMchNo },
    });
  },
  /** 全量保存能力应用关联 */
  saveBatch(data: WechatMchAppCapabilityBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/mch-app/capability/save-batch', data });
  },
  /** 查询微信直连支持的支付能力候选 */
  listSupportedCapabilities(): Promise<Result<WechatCapabilityOption[]>> {
    return defHttp.get({ url: '/admin/wechat/mch-app/capability/list-supported-capabilities' });
  },
};

/** 微信直连商户应用支付能力关联 */
export interface WechatMchAppCapability extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 支付能力编码 */
  capability?: string;
  /** 关联微信直连应用ID */
  wechatDirectAppId?: string;
  /** 应用名称(冗余展示) */
  appName?: string;
  /** 微信应用AppId(冗余展示) */
  wxAppId?: string;
  /** 应用类型(冗余展示): official_account/mini_program/mobile_app */
  appType?: string;
}

/** 支付能力关联应用单项 */
export interface WechatMchAppCapabilityItem {
  /** 支付能力编码 */
  capability: string;
  /** 关联微信直连应用ID */
  wechatDirectAppId: string;
}

/** 支付能力关联应用批量保存参数 */
export interface WechatMchAppCapabilityBatchParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户号 */
  channelMchNo: string;
  /** 支付能力关联应用列表 */
  items: WechatMchAppCapabilityItem[];
}

/** 支付能力候选项 */
export interface WechatCapabilityOption {
  /** 支付能力编码 */
  code: string;
  /** 国际化名称 */
  name: string;
}
