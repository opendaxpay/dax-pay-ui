import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝直连商户应用支付能力关联 API（商户端 /mch/alipay/direct-app/capability/*）
 */
export const AlipayDirectAppCapabilityApi = {
  /** 查询通道商户的能力应用关联列表 */
  listByChannelMchNo(channelMchNo: string): Promise<Result<AlipayDirectAppCapabilityResult[]>> {
    return defHttp.get({
      url: '/mch/alipay/direct-app/capability/list-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /** 全量保存能力应用关联 */
  saveBatch(data: AlipayDirectAppCapabilityBatchParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/mch/alipay/direct-app/capability/save-batch',
      data,
    });
  },
  /** 查询支付宝直连支持的支付能力候选 */
  listSupportedCapabilities(): Promise<Result<AlipayDirectCapabilityOption[]>> {
    return defHttp.get({
      url: '/mch/alipay/direct-app/capability/list-supported-capabilities',
    });
  },
};

/** 支付能力关联结果 */
export interface AlipayDirectAppCapabilityResult {
  id?: string;
  channelMchNo?: string;
  capability?: string;
  alipayDirectAppId?: string;
  appName?: string;
  aliAppId?: string;
  appType?: string;
}

/** 支付能力候选项 */
export interface AlipayDirectCapabilityOption {
  code: string;
  name: string;
}

/** 支付能力关联单项 */
export interface AlipayDirectAppCapabilityItem {
  capability: string;
  alipayDirectAppId: string;
}

/** 支付能力关联批量保存参数 */
export interface AlipayDirectAppCapabilityBatchParam {
  channelMchNo: string;
  items: AlipayDirectAppCapabilityItem[];
}
