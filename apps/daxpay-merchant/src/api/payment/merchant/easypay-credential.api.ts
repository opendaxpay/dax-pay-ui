import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 易支付凭证 API（应用级，商户端）
 *
 * 后端 plugin 已双挂 `/admin/easypay/credential` 与 `/mch/easypay/credential`。
 */
export const EasyPayCredentialApi = {
  /**
   * 按应用号查询（不存在则自动创建）
   */
  getByAppId(appId: string): Promise<Result<EasyPayCredentialResult>> {
    return defHttp.get({ url: '/mch/easypay/credential/get-by-app-id', params: { appId } });
  },
  /**
   * 更新凭证
   */
  update(data: EasyPayCredentialParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/easypay/credential/update', data });
  },
};

export interface EasyPayCredentialResult extends BaseEntity {
  pid?: number;
  appId?: string;
  enable?: boolean;
  enableV1?: boolean;
  enableV2?: boolean;
  md5Key?: string;
  useSystemKey?: boolean;
  publicKey?: string;
  platformPublicKey?: string;
  easyPayV1ApiUrl?: string;
  easyPayV2ApiUrl?: string;
}

export interface EasyPayCredentialParam {
  id?: string;
  appId: string;
  enable?: boolean;
  enableV1?: boolean;
  enableV2?: boolean;
  md5Key?: string;
  useSystemKey?: boolean;
  publicKey?: string;
}
