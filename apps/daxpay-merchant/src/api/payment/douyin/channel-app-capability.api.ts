import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 通道商户抖音应用能力绑定 API（商户端 /mch/douyin/channel-app-capability）
 */
export const DyChannelAppCapabilityApi = {
  /** 按通道商户号查询能力绑定 */
  listByChannelMchNo(channelMchNo: string): Promise<Result<DyChannelAppCapability[]>> {
    return defHttp.get({
      url: '/mch/douyin/channel-app-capability/list-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /** 按产品查询可绑定的支付能力候选 */
  listSupportedCapabilities(product: string): Promise<Result<DyCapabilityOption[]>> {
    return defHttp.get({
      url: '/mch/douyin/channel-app-capability/list-supported-capabilities',
      params: { product },
    });
  },
  /** 全量保存能力绑定（mchNo 由后端上下文注入，channelMchNo + items 放 body） */
  saveBatch(data: DyChannelAppCapabilityBatchParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/mch/douyin/channel-app-capability/save-batch',
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
  channelMchNo: string;
  items: DyChannelAppCapabilityItem[];
}

/** 支付能力选项 */
export interface DyCapabilityOption {
  code: string;
  name: string;
}
