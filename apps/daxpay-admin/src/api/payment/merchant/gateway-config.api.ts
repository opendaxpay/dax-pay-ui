import type { BaseEntity, ChannelMchOption, LabelValue, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 网关支付配置 API(码牌/聚合共用)
 * 对接后端 GatewayPayConfigAdminController
 */
export const GatewayPayConfigApi = {
  /** 按应用查询网关支付配置 */
  getByAppId(appId: string): Promise<Result<GatewayPayConfigResult>> {
    return defHttp.get({
      url: '/admin/gateway/pay-config/get-by-app-id',
      params: { appId },
    });
  },

  /** 保存或更新网关支付配置 */
  saveOrUpdate(data: GatewayPayConfigParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/gateway/pay-config/save-or-update',
      data,
    });
  },

  /**
   * DIRECT: 按商户+支付渠道列通道商户候选（不绑默认 JSAPI method）
   */
  listDirectChannelMchCandidates(params: { mchNo: string; provider: string }): Promise<Result<ChannelMchOption[]>> {
    return defHttp.get({
      url: '/admin/gateway/pay-config/direct-channel-mch-candidates',
      params,
    });
  },

  /**
   * DIRECT: 按通道商户列全部已挂载支付能力（含 H5/主扫等）
   */
  listDirectCapabilityCandidates(channelMchNo: string): Promise<Result<LabelValue[]>> {
    return defHttp.get({
      url: '/admin/gateway/pay-config/direct-capability-candidates',
      params: { channelMchNo },
    });
  },
};

/** 网关支付配置结果 */
export interface GatewayPayConfigResult extends BaseEntity {
  appId?: string;
  mchNo?: string;
  /** 配置深度: auto/method/direct */
  level?: string;
  /** 是否自动拉起支付(码牌仅对固定金额生效) */
  autoLaunch?: boolean;
  clientEnvs?: GatewayPayClientEnvResult[];
}

/** 环境×形态配置结果 */
export interface GatewayPayClientEnvResult {
  clientEnv?: string;
  /** h5 / mini */
  payForm?: string;
  method?: string;
  channelMchNo?: string;
  capability?: string;
}

/** 网关支付配置参数 */
export interface GatewayPayConfigParam {
  mchNo: string;
  appId: string;
  level: string;
  /** 是否自动拉起支付 */
  autoLaunch?: boolean;
  clientEnvs?: GatewayPayClientEnvParam[];
}

/** 环境×形态配置参数 */
export interface GatewayPayClientEnvParam {
  clientEnv?: string;
  payForm?: string;
  method?: string;
  channelMchNo?: string;
  capability?: string;
}

export type { LabelValue };
