import type { BaseEntity, LabelValue, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 码牌支付策略配置 API
 * 对接后端 GatewayCodeConfigAdminController
 */
export const CodeConfigApi = {
  /** 按应用查询码牌支付配置 */
  getByAppId(appId: string): Promise<Result<CodeConfigResult>> {
    return defHttp.get({
      url: '/admin/gateway/code-config/get-by-app-id',
      params: { appId },
    });
  },

  /** 保存或更新码牌支付配置 */
  saveOrUpdate(data: CodeConfigParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/gateway/code-config/save-or-update',
      data,
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
