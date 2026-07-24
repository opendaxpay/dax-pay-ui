import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝服务商代运营授权 API（商户端 /mch/alipay/isv-auth/*）
 *
 * 商户号后端强制取 PaymentContext；查询结果脱敏，不含 appAuthToken。
 */
export const MchAlipayIsvAuthApi = {
  /**
   * 查询单个通道商户的授权状态（脱敏，供通道商户详情抽屉展示）
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<MchAlipayIsvAuthResult>> {
    return defHttp.get({ url: '/mch/alipay/isv-auth/find', params: { channelMchNo } });
  },
  /**
   * 生成代运营授权链接（支付宝深链，可出二维码）
   */
  genAuthUrl(data: AlipayIsvAuthParam): Promise<Result<AlipayIsvAuthUrlResult>> {
    return defHttp.post({ url: '/mch/alipay/isv-auth/gen-auth-url', data });
  },
  /**
   * 获取代运营授权回调地址（用于支付宝开放平台配置参考）
   */
  getAuthCallbackUrl(): Promise<Result<string>> {
    return defHttp.get({ url: '/mch/alipay/isv-auth/auth-callback-url' });
  },
};

/**
 * 支付宝服务商代运营授权列表项（商户端，脱敏）
 */
export interface MchAlipayIsvAuthResult extends BaseEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 子商户支付宝识别码(2088开头) */
  alipayUserId?: string;
  /** 是否已授权(appAuthToken 是否已绑定) */
  authorized?: boolean;
}

/**
 * 代运营授权参数
 */
export interface AlipayIsvAuthParam {
  /** 通道商户号 */
  channelMchNo: string;
}

/**
 * 代运营授权链接结果
 */
export interface AlipayIsvAuthUrlResult {
  /** 支付宝代运营授权深链 */
  authUrl?: string;
}
