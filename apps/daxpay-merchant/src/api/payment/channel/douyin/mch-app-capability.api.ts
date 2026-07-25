import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 抖音直连商户应用支付能力关联 API（商户端 /mch/douyin/mch-app/capability/*）
 *
 * 后端强制 mchNo=PaymentContext，前端不必/不应传跨商户 mchNo。
 */
export const DouyinMchAppCapabilityApi = {
  /**
   * 查询通道商户的能力应用关联列表（当前商户）
   */
  listByChannelMchNo(channelMchNo: string): Promise<Result<DouyinMchAppCapability[]>> {
    return defHttp.get({
      url: '/mch/douyin/mch-app/capability/list-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 全量保存能力应用关联
   */
  saveBatch(data: DouyinMchAppCapabilityBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/douyin/mch-app/capability/save-batch', data });
  },
  /**
   * 查询抖音直连支持的支付能力候选
   */
  listSupportedCapabilities(): Promise<Result<DouyinCapabilityOption[]>> {
    return defHttp.get({ url: '/mch/douyin/mch-app/capability/list-supported-capabilities' });
  },
};

/** 抖音直连商户应用支付能力关联 */
export interface DouyinMchAppCapability extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 支付能力编码 */
  capability?: string;
  /** 关联抖音直连应用ID */
  douyinDirectAppId?: string;
  /** 应用名称(冗余展示) */
  appName?: string;
  /** 抖音应用AppId(冗余展示) */
  douyinAppId?: string;
  /** 应用类型(冗余展示): mini_program/mobile_app/web_app */
  appType?: string;
}

/** 支付能力关联应用单项 */
export interface DouyinMchAppCapabilityItem {
  /** 支付能力编码 */
  capability: string;
  /** 关联抖音直连应用ID */
  douyinDirectAppId: string;
}

/** 支付能力关联应用批量保存参数 */
export interface DouyinMchAppCapabilityBatchParam {
  /** 通道商户号 */
  channelMchNo: string;
  /** 支付能力关联应用列表 */
  items: DouyinMchAppCapabilityItem[];
}

/** 支付能力候选项 */
export interface DouyinCapabilityOption {
  /** 支付能力编码 */
  code: string;
  /** 国际化名称 */
  name: string;
}
