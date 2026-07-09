import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 认证调试 API
 */
export const DevelopAuthApi = {
  /**
   * 生成支付宝授权链接
   */
  generateAuthUrl(): Promise<Result<AuthUrlResult>> {
    return defHttp.post({ url: '/admin/develop/auth/generate-auth-url' });
  },

  /**
   * 通过查询码获取认证结果
   */
  queryAuthResult(queryCode: string): Promise<Result<AuthResult>> {
    return defHttp.get({
      url: '/admin/develop/auth/query-auth-result',
      params: { queryCode },
    });
  },
};

/** 授权链接结果 */
export interface AuthUrlResult {
  /** 授权访问链接 */
  authUrl?: string;
  /** 查询标识码 */
  queryCode?: string;
}

/** 认证结果 */
export interface AuthResult {
  /** OpenId */
  openId?: string;
  /** 用户ID */
  userId?: string;
  /** AccessToken */
  accessToken?: string;
  /** 状态 waiting/success/not_exist */
  status?: string;
}
