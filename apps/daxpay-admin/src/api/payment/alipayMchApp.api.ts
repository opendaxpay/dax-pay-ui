import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝通道商户应用管理 API
 */
export const AlipayMchAppApi = {
  /** 查询通道商户应用列表 */
  listByChannelMchNo(mchNo: string, channelMchNo: string): Promise<Result<AlipayMchApp[]>> {
    return defHttp.get({
      url: '/admin/alipay/mch-app/list-by-channel-mch-no',
      params: { mchNo, channelMchNo },
    });
  },
  /** 查询应用详情 */
  findById(id: string): Promise<Result<AlipayMchApp>> {
    return defHttp.get({ url: '/admin/alipay/mch-app/find-by-id', params: { id } });
  },
  /** 同一通道商户下支付宝 AppId 是否已存在（新增） */
  existsAliAppId(mchNo: string, channelMchNo: string, aliAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/alipay/mch-app/exists-ali-app-id-by-channel',
      params: { mchNo, channelMchNo, aliAppId },
    });
  },
  /** 同一通道商户下支付宝 AppId 是否已存在（编辑，排除自身） */
  existsAliAppIdNotId(
    mchNo: string,
    channelMchNo: string,
    aliAppId: string,
    id: string,
  ): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/alipay/mch-app/exists-ali-app-id-by-channel-not-id',
      params: { mchNo, channelMchNo, aliAppId, id },
    });
  },
  /** 新增通道商户应用 */
  add(data: AlipayMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/mch-app/add', data });
  },
  /** 修改通道商户应用 */
  update(data: AlipayMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/mch-app/update', data });
  },
  /** 删除通道商户应用 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/mch-app/delete', params: { id } });
  },
  /** 查询应用密钥配置 */
  findKeyConfigByAppId(appId: string): Promise<Result<AlipayMchAppKeyConfig>> {
    return defHttp.get({
      url: '/admin/alipay/mch-app/find-key-config-by-app-id',
      params: { appId },
    });
  },
  /** 保存应用密钥配置 */
  saveKeyConfig(data: AlipayMchAppKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/mch-app/save-key-config', data });
  },
  /** 查询应用授权认证配置 */
  findAuthConfigByAppId(appId: string): Promise<Result<AlipayMchAppAuthConfig>> {
    return defHttp.get({
      url: '/admin/alipay/mch-app/find-auth-config-by-app-id',
      params: { appId },
    });
  },
  /** 保存应用授权认证配置 */
  saveAuthConfig(data: AlipayMchAppAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/mch-app/save-auth-config', data });
  },
};

/** 支付宝通道商户应用 */
export interface AlipayMchApp extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 应用名称 */
  appName?: string;
  /** 支付宝应用 ID */
  aliAppId?: string;
}

/** 支付宝通道商户应用密钥配置 */
export interface AlipayMchAppKeyConfig {
  /** 应用 ID */
  appId?: string;
  /** 商户号 */
  mchNo?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 认证类型 */
  authType?: string;
  /** 支付宝公钥 */
  alipayPublicKey?: string;
  /** 应用私钥 */
  privateKey?: string;
  /** 应用公钥证书 */
  appCert?: string;
  /** 支付宝公钥证书 */
  alipayCert?: string;
  /** 支付宝根证书 */
  alipayRootCert?: string;
  /** AES 通信密钥 */
  secretKey?: string;
}

/** 支付宝通道商户应用授权认证配置 */
export interface AlipayMchAppAuthConfig {
  /** 应用 ID */
  appId?: string;
  /** 商户号 */
  mchNo?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 用户标识类型 */
  userIdType?: string;
  /** 授权回调地址 */
  authCallbackUrl?: string;
}
