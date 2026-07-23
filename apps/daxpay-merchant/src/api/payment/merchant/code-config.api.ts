import type { BaseEntity, ChannelMchOption, LabelValue, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 码牌支付策略配置 API（商户端）
 * 对接后端 MchGatewayCodeConfigController
 */
export const CodeConfigApi = {
  /** 按应用查询码牌支付配置 */
  getByAppId(appId: string): Promise<Result<CodeConfigResult>> {
    return defHttp.get({
      url: '/mch/gateway/code-config/get-by-app-id',
      params: { appId },
    });
  },

  /** 保存或更新码牌支付配置 */
  saveOrUpdate(data: CodeConfigParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/mch/gateway/code-config/save-or-update',
      data,
    });
  },

  /**
   * DIRECT: 按当前商户+支付渠道列通道商户候选（mchNo 由后端上下文强制）
   */
  listDirectChannelMchCandidates(params: { provider: string }): Promise<Result<ChannelMchOption[]>> {
    return defHttp.get({
      url: '/mch/gateway/code-config/direct-channel-mch-candidates',
      params,
    });
  },

  /**
   * DIRECT: 按通道商户列全部已挂载支付能力（含 H5/主扫等）
   */
  listDirectCapabilityCandidates(channelMchNo: string): Promise<Result<LabelValue[]>> {
    return defHttp.get({
      url: '/mch/gateway/code-config/direct-capability-candidates',
      params: { channelMchNo },
    });
  },
};

/** 码牌支付策略配置结果 */
export interface CodeConfigResult extends BaseEntity {
  appId?: string;
  mchNo?: string;
  /** 配置深度: auto/method/direct */
  level?: string;
  clientEnvs?: CodeClientEnvResult[];
}

/** 环境×形态配置结果 */
export interface CodeClientEnvResult {
  clientEnv?: string;
  /** h5 / mini */
  payForm?: string;
  method?: string;
  channelMchNo?: string;
  capability?: string;
}

/** 码牌支付策略配置参数 */
export interface CodeConfigParam {
  mchNo: string;
  appId: string;
  level: string;
  clientEnvs?: CodeClientEnvParam[];
}

/** 环境×形态配置参数 */
export interface CodeClientEnvParam {
  clientEnv?: string;
  payForm?: string;
  method?: string;
  channelMchNo?: string;
  capability?: string;
}

export type { LabelValue };
