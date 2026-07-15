import type { BaseEntity, LabelValue, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 聚合扫码配置 API
 * 对接后端 GatewayAggregateConfigAdminController
 */
export const AggregateConfigApi = {
  /** 按应用查询聚合扫码配置 */
  getByAppId(appId: string): Promise<Result<AggregateConfigResult>> {
    return defHttp.get({
      url: '/admin/gateway/aggregate-config/get-by-app-id',
      params: { appId },
    });
  },

  /** 保存或更新聚合扫码配置 */
  saveOrUpdate(data: AggregateConfigParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/gateway/aggregate-config/save-or-update',
      data,
    });
  },
};

/** 聚合扫码配置结果 */
export interface AggregateConfigResult extends BaseEntity {
  appId?: string;
  mchNo?: string;
  /** 配置深度: auto/method/direct */
  level?: string;
  autoLaunch?: boolean;
  clientEnvs?: AggregateClientEnvResult[];
}

/** 场景配置结果 */
export interface AggregateClientEnvResult {
  /** 场景编码: wechat/alipay/union_pay/douyin */
  clientEnv?: string;
  /** 支付方式(METHOD 模式) */
  method?: string;
  /** 通道商户号(DIRECT 模式) */
  channelMchNo?: string;
  /** 支付能力(DIRECT 模式) */
  capability?: string;
}

/** 聚合扫码配置参数 */
export interface AggregateConfigParam {
  mchNo: string;
  appId: string;
  level: string;
  autoLaunch?: boolean;
  clientEnvs?: AggregateClientEnvParam[];
}

/** 场景配置参数 */
export interface AggregateClientEnvParam {
  clientEnv?: string;
  method?: string;
  channelMchNo?: string;
  capability?: string;
}

// re-export LabelValue 供消费方就近引用
export type { LabelValue };
