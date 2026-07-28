import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 通道商户微信应用能力绑定 API（商户端 /mch/wx/channel-app-capability）
 */
export const WxChannelAppCapabilityApi = {
  /** 按通道商户号查询能力绑定 */
  listByChannelMchNo(channelMchNo: string): Promise<Result<WxChannelAppCapability[]>> {
    return defHttp.get({
      url: '/mch/wx/channel-app-capability/list-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /** 按产品查询可绑定的支付能力候选 */
  listSupportedCapabilities(product: string): Promise<Result<WxCapabilityOption[]>> {
    return defHttp.get({
      url: '/mch/wx/channel-app-capability/list-supported-capabilities',
      params: { product },
    });
  },
  /** 全量保存能力绑定（mchNo 由后端上下文注入，channelMchNo + items 放 body） */
  saveBatch(data: WxChannelAppCapabilityBatchParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/mch/wx/channel-app-capability/save-batch',
      data,
    });
  },
};

/** 通道能力绑定 */
export interface WxChannelAppCapability {
  mchNo?: string;
  channelMchNo?: string;
  capability?: string;
  /** platform | merchant */
  appScope?: string;
  wxAppRefId?: string;
  appName?: string;
  wxAppId?: string;
  appType?: string;
}

/** 绑定单项 */
export interface WxChannelAppCapabilityItem {
  capability: string;
  appScope: string;
  wxAppRefId: string;
}

/** 批量保存 */
export interface WxChannelAppCapabilityBatchParam {
  channelMchNo: string;
  items: WxChannelAppCapabilityItem[];
}

/** 支付能力选项 */
export interface WxCapabilityOption {
  code: string;
  name: string;
}
