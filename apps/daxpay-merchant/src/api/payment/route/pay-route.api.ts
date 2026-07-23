import type { BaseEntity, ChannelMchOption, LabelValue, Result } from '#/types/web';

import { defHttp } from '#/api/request';

// 标签值（从公共类型 re-export，便于消费方就近引用）
export type { LabelValue };

/** 渠道支付方式行（通道路由扁平目录） */
export interface PayProviderMethod {
  provider: string;
  method: string;
  methodLabel?: string;
  sortNo?: number;
  /** 目录项说明 */
  description?: string;
}

// 通道路由 API（商户端）：策略、基础/场景配置及已启用目录
export const PayRouteApi = {
  /** 已启用渠道+方式扁平目录 */
  listMethodDirectoryFlat(): Promise<Result<PayProviderMethod[]>> {
    return defHttp.get({ url: '/mch/pay-route/method-directory/flat-list' });
  },

  getOrInitStrategy(appId: string): Promise<Result<PayRouteStrategyResult>> {
    return defHttp.get({ url: '/mch/pay-route/strategy/get-or-init-by-app-id', params: { appId } });
  },

  updateStrategy(data: PayRouteStrategyParam): Promise<Result<PayRouteStrategyResult>> {
    return defHttp.post({ url: '/mch/pay-route/strategy/update', data });
  },

  listSceneConfig(appId: string): Promise<Result<PayRouteSceneConfigResult[]>> {
    return defHttp.get({ url: '/mch/pay-route/scene-config/list-by-app-id', params: { appId } });
  },

  saveSceneBatch(data: PayRouteSceneConfigBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/pay-route/scene-config/save-batch', data });
  },

  /** 通道路由白名单目录下全部 (provider|method) 通道商户候选 */
  listSceneChannelMchCandidatesBatch(params: { appId: string }): Promise<Result<Record<string, ChannelMchOption[]>>> {
    return defHttp.get({
      url: '/mch/pay-route/scene-config/channel-mch-candidates-batch',
      params,
    });
  },

  /** 目录项下商户已开通的通道商户候选 */
  listSceneChannelMchCandidates(params: PayRouteSceneChannelMchCandidatesQuery): Promise<Result<ChannelMchOption[]>> {
    return defHttp.get({
      url: '/mch/pay-route/scene-config/channel-mch-candidates',
      params,
    });
  },

  /** 目录项与通道商户下支付能力候选 */
  listSceneCapabilityCandidates(params: PayRouteSceneCapabilityCandidatesQuery): Promise<Result<LabelValue[]>> {
    return defHttp.get({
      url: '/mch/pay-route/scene-config/capability-candidates',
      params,
    });
  },

  /** 按目录项与通道商户批量返回支付能力候选，key 为 provider|method|channelMchNo */
  listSceneCapabilityCandidatesBatch(
    params: PayRouteSceneCapabilityBatchQuery,
  ): Promise<Result<Record<string, LabelValue[]>>> {
    return defHttp.post({
      url: '/mch/pay-route/scene-config/capability-candidates-batch',
      data: params,
    });
  },

  listBasicConfig(appId: string): Promise<Result<PayRouteBasicConfigResult[]>> {
    return defHttp.get({
      url: '/mch/pay-route/basic-config/list-by-app-id',
      params: { appId },
    });
  },

  saveBasicBatch(data: PayRouteBasicConfigBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/pay-route/basic-config/save-batch', data });
  },
};

export interface PayRouteStrategyResult extends BaseEntity {
  appId?: string;
  mchNo?: string;
  mode?: string;
}

export interface PayRouteStrategyParam {
  appId: string;
  mode?: string;
}

export interface PayRouteSceneConfigResult extends BaseEntity {
  strategyId?: string;
  method?: string;
  channelMchNo?: string;
  capability?: string;
}

export interface PayRouteSceneConfigItem {
  /** 通道商户号(场景模式定位通道商户，由其推导支付产品) */
  channelMchNo?: string;
  /** 支付能力 */
  capability?: string;
  method?: string;
}

export interface PayRouteSceneConfigBatchParam {
  appId: string;
  items: PayRouteSceneConfigItem[];
}

export interface PayRouteSceneChannelMchCandidatesQuery {
  appId: string;
  provider: string;
  method?: string;
}

export interface PayRouteSceneCapabilityCandidatesQuery {
  appId: string;
  provider: string;
  method: string;
  channelMchNo: string;
}

export interface PayRouteSceneCapabilityBatchQuery {
  appId: string;
  items: PayRouteSceneCapabilityBatchItem[];
}

export interface PayRouteSceneCapabilityBatchItem {
  provider: string;
  method: string;
  channelMchNo: string;
}

/** 基础模式配置（含可选通道商户列表） */
export interface PayRouteBasicConfigResult extends BaseEntity {
  provider?: string;
  channelMchNo?: string;
  /** 该渠道下可选通道商户列表（名称/号码） */
  channelMchants?: LabelValue[];
}

export interface PayRouteBasicConfigItem {
  provider: string;
  channelMchNo?: string;
}

export interface PayRouteBasicConfigBatchParam {
  appId: string;
  items: PayRouteBasicConfigItem[];
}
