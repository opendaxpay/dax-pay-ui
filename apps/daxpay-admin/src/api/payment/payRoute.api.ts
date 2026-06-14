import type { PayProviderMethod } from '#/api/payment/masterdata/provider.api';
import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

// 通道路由 API（管理端）：策略、基础/场景配置及已启用目录
export const PayRouteApi = {
  /** 已启用渠道+方式扁平目录（`PayProviderMethodService`，权限归属通道路由菜单） */
  listMethodDirectoryFlat(): Promise<Result<PayProviderMethod[]>> {
    return defHttp.get({ url: '/admin/merchant/pay-route/method-directory/flat-list' });
  },

  getOrInitStrategy(appId: string): Promise<Result<PayRouteStrategyResult>> {
    return defHttp.get({ url: '/admin/merchant/pay-route/strategy/get-or-init-by-app-id', params: { appId } });
  },

  updateStrategy(data: PayRouteStrategyParam): Promise<Result<PayRouteStrategyResult>> {
    return defHttp.post({ url: '/admin/merchant/pay-route/strategy/update', data });
  },

  listSceneConfig(appId: string): Promise<Result<PayRouteSceneConfigResult[]>> {
    return defHttp.get({ url: '/admin/merchant/pay-route/scene-config/list-by-app-id', params: { appId } });
  },

  saveSceneBatch(data: PayRouteSceneConfigBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/pay-route/scene-config/save-batch', data });
  },

  listSceneProductCandidates(params: PayRouteSceneProductCandidatesQuery): Promise<Result<LabelValue[]>> {
    return defHttp.get({
      url: '/admin/merchant/pay-route/scene-config/product-candidates',
      params,
    });
  },

  /** 通道路由白名单目录下全部 (provider|method) 产品候选 */
  listSceneProductCandidatesBatch(params: { appId: string }): Promise<Result<Record<string, LabelValue[]>>> {
    return defHttp.get({
      url: '/admin/merchant/pay-route/scene-config/product-candidates-batch',
      params,
    });
  },

  listSceneCapabilityCandidates(params: PayRouteSceneCapabilityCandidatesQuery): Promise<Result<LabelValue[]>> {
    return defHttp.get({
      url: '/admin/merchant/pay-route/scene-config/capability-candidates',
      params,
    });
  },

  /** 按目录项与产品批量返回支付能力候选，key 为 provider|method|product */
  listSceneCapabilityCandidatesBatch(
    params: PayRouteSceneCapabilityBatchQuery,
  ): Promise<Result<Record<string, LabelValue[]>>> {
    return defHttp.post({
      url: '/admin/merchant/pay-route/scene-config/capability-candidates-batch',
      data: params,
    });
  },

  inferSceneCapability(params: PayRouteSceneCapabilityCandidatesQuery): Promise<Result<string>> {
    return defHttp.get({
      url: '/admin/merchant/pay-route/scene-config/infer-capability',
      params,
    });
  },

  listBasicConfig(appId: string): Promise<Result<PayRouteBasicConfigResult[]>> {
    return defHttp.get({
      url: '/admin/merchant/pay-route/basic-config/list-by-app-id',
      params: { appId },
    });
  },

  saveBasicBatch(data: PayRouteBasicConfigBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/pay-route/basic-config/save-batch', data });
  },

};

export interface LabelValue {
  label?: string;
  value?: string;
}

export interface PayRouteStrategyResult extends BaseEntity {
  appId?: string;
  mchNo?: string;
  mode?: string;
  /** 支付渠道 */
  provider?: string;
  enable?: boolean;
  name?: string;
}

export interface PayRouteStrategyParam {
  appId: string;
  mode?: string;
  /** 支付渠道 */
  provider?: string;
  enable?: boolean;
  name?: string;
}

export interface PayRouteSceneConfigResult extends BaseEntity {
  strategyId?: string;
  provider?: string;
  channel?: string;
  method?: string;
  product?: string;
}

export interface PayRouteSceneConfigItem {
  provider?: string;
  /** 场景模式（有 provider）以产品为主；保存时服务端解析 channel/method */
  product?: string;
  /** 支付能力（保存校验用，不落库） */
  capability?: string;
  channel?: string;
  method?: string;
}

export interface PayRouteSceneConfigBatchParam {
  appId: string;
  items: PayRouteSceneConfigItem[];
}

export interface PayRouteSceneProductCandidatesQuery {
  appId: string;
  provider: string;
  method?: string;
}

export interface PayRouteSceneCapabilityCandidatesQuery {
  appId: string;
  provider: string;
  method: string;
  product: string;
}

export interface PayRouteSceneCapabilityBatchQuery {
  appId: string;
  items: PayRouteSceneCapabilityBatchItem[];
}

export interface PayRouteSceneCapabilityBatchItem {
  provider: string;
  method: string;
  product: string;
}

/** 基础模式配置（含可选产品列表） */
export interface PayRouteBasicConfigResult extends BaseEntity {
  provider?: string;
  product?: string;
  /** 该渠道下可选支付产品编码 */
  products?: string[];
}

export interface PayRouteBasicConfigItem {
  provider: string;
  product?: string;
}

export interface PayRouteBasicConfigBatchParam {
  appId: string;
  items: PayRouteBasicConfigItem[];
}
