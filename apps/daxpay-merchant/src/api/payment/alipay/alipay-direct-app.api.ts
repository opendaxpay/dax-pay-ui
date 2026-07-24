import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝直连商户应用 API（商户端 /mch/alipay/direct-app/*）
 *
 * 后端强制 mchNo=PaymentContext，前端不必/不应传跨商户 mchNo。
 */
export const AlipayDirectAppApi = {
  /** 根据通道商户号查询应用列表 */
  listByChannelMchNo(channelMchNo: string): Promise<Result<AlipayDirectAppResult[]>> {
    return defHttp.get({
      url: '/mch/alipay/direct-app/list-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /** 查询应用详情 */
  findById(id: string): Promise<Result<AlipayDirectAppResult>> {
    return defHttp.get({ url: '/mch/alipay/direct-app/find-by-id', params: { id } });
  },
  /** 同一通道商户下支付宝应用ID是否已存在 */
  existsAliAppId(channelMchNo: string, aliAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/mch/alipay/direct-app/exists-ali-app-id-by-channel',
      params: { channelMchNo, aliAppId },
    });
  },
  /** 同一通道商户下支付宝应用ID是否已存在(排除自身) */
  existsAliAppIdNotId(channelMchNo: string, aliAppId: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/mch/alipay/direct-app/exists-ali-app-id-by-channel-not-id',
      params: { channelMchNo, aliAppId, id },
    });
  },
  /** 新增应用 */
  add(data: AlipayDirectAppParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/alipay/direct-app/add', data });
  },
  /** 修改应用 */
  update(data: AlipayDirectAppParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/alipay/direct-app/update', data });
  },
  /** 删除应用 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/alipay/direct-app/delete', params: { id } });
  },
  /** 查询应用密钥配置 */
  findKeyConfig(alipayDirectAppId: string, sandbox: boolean): Promise<Result<AlipayDirectAppKeyConfigResult>> {
    return defHttp.get({
      url: '/mch/alipay/direct-app/find-key-config-by-app-id',
      params: { alipayDirectAppId, sandbox },
    });
  },
  /** 保存应用密钥配置 */
  saveKeyConfig(data: AlipayDirectAppKeyConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/alipay/direct-app/save-key-config', data });
  },
  /** 查询应用授权认证配置 */
  findAuthConfig(alipayDirectAppId: string): Promise<Result<AlipayDirectAppAuthConfigResult>> {
    return defHttp.get({
      url: '/mch/alipay/direct-app/find-auth-config-by-app-id',
      params: { alipayDirectAppId },
    });
  },
  /** 保存应用授权认证配置 */
  saveAuthConfig(data: AlipayDirectAppAuthConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/alipay/direct-app/save-auth-config', data });
  },
};

/** 支付宝直连商户应用 */
export interface AlipayDirectAppResult {
  id?: string;
  mchNo?: string;
  channelMchNo?: string;
  appName?: string;
  aliAppId?: string;
  appType?: string;
}

/** 支付宝直连商户应用保存参数 */
export interface AlipayDirectAppParam {
  id?: string;
  channelMchNo: string;
  appName: string;
  aliAppId: string;
  appType: string;
}

/** 支付宝直连应用密钥配置结果（敏感字段脱敏） */
export interface AlipayDirectAppKeyConfigResult {
  id?: string;
  mchNo?: string;
  channelMchNo?: string;
  authType?: string;
  alipayPublicKey?: string;
  privateKey?: string;
  appCert?: string;
  alipayCert?: string;
  alipayRootCert?: string;
  secretKey?: string;
  sandbox?: boolean;
}

/** 支付宝直连应用密钥配置保存参数 */
export interface AlipayDirectAppKeyConfigParam {
  alipayDirectAppId: string;
  channelMchNo: string;
  authType: string;
  alipayPublicKey?: string;
  privateKey?: string;
  appCert?: string;
  alipayCert?: string;
  alipayRootCert?: string;
  secretKey?: string;
  sandbox: boolean;
}

/** 支付宝直连应用授权认证配置结果 */
export interface AlipayDirectAppAuthConfigResult {
  id?: string;
  mchNo?: string;
  channelMchNo?: string;
  alipayDirectAppId?: string;
  userIdType?: string;
}

/** 支付宝直连应用授权认证配置保存参数 */
export interface AlipayDirectAppAuthConfigParam {
  alipayDirectAppId: string;
  channelMchNo: string;
  userIdType: string;
}
