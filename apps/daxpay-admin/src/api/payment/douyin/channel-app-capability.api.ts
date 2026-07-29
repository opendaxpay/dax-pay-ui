import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 通道商户抖音应用能力绑定 API
 */
export const DyChannelAppCapabilityApi = {
  /** 按通道商户号查询能力绑定 */
  listByChannelMchNo(channelMchNo: string): Promise<Result<DyChannelAppCapability[]>> {
    return defHttp.get({
      url: '/admin/douyin/channel-app-capability/list-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /** 全量保存能力绑定（mchNo + channelMchNo + items 均放 body） */
  saveBatch(data: DyChannelAppCapabilityBatchParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/douyin/channel-app-capability/save-batch',
      data,
    });
  },
};

/** 通道能力绑定 */
export interface DyChannelAppCapability {
  mchNo?: string;
  channelMchNo?: string;
  capability?: string;
  /** platform | merchant */
  appScope?: string;
  dyAppRefId?: string;
  appName?: string;
  douyinAppId?: string;
  appType?: string;
}

/** 绑定单项 */
export interface DyChannelAppCapabilityItem {
  capability: string;
  appScope: string;
  dyAppRefId: string;
}

/** 批量保存 */
export interface DyChannelAppCapabilityBatchParam {
  mchNo: string;
  channelMchNo: string;
  items: DyChannelAppCapabilityItem[];
}
