import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 通道商户微信应用能力绑定 API
 */
export const WxChannelAppCapabilityApi = {
  /** 按通道商户号查询能力绑定 */
  listByChannelMchNo(channelMchNo: string): Promise<Result<WxChannelAppCapability[]>> {
    return defHttp.get({
      url: '/admin/wx/channel-app-capability/list-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /** 全量保存能力绑定（mchNo + channelMchNo + items 均放 body） */
  saveBatch(data: WxChannelAppCapabilityBatchParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/wx/channel-app-capability/save-batch',
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
  mchNo: string;
  channelMchNo: string;
  items: WxChannelAppCapabilityItem[];
}
