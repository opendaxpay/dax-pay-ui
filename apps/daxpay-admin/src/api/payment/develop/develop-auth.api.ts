import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 认证调试 API
 */
export const DevelopAuthApi = {
  /**
   * 生成支付宝 OAuth 授权链接
   */
  generateAlipayAuthUrl(): Promise<Result<AuthUrlResult>> {
    return defHttp.post({ url: '/admin/develop/auth/generate-alipay-auth-url' });
  },

  /**
   * 生成微信公众号配置授权链接(平台级)
   */
  generateWechatMpAuthUrl(): Promise<Result<AuthUrlResult>> {
    return defHttp.post({ url: '/admin/develop/auth/generate-wechat-mp-auth-url' });
  },

  /**
   * 生成抖音H5授权链接(平台级)
   */
  generateDouyinAuthUrl(): Promise<Result<AuthUrlResult>> {
    return defHttp.post({ url: '/admin/develop/auth/generate-douyin-auth-url' });
  },

  /**
   * 生成微信支付(直连/服务商)授权链接
   */
  generateChannelAuthUrl(data: DevelopChannelAuthParam): Promise<Result<AuthUrlResult>> {
    return defHttp.post({
      url: '/admin/develop/auth/generate-channel-auth-url',
      data,
    });
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

/** 认证调试 - 微信支付授权参数 */
export interface DevelopChannelAuthParam {
  /** 商户号 */
  mchNo: string;
  /** 应用档位(platform/merchant) */
  scope: string;
  /** 应用主键 */
  appId: string;
}
