import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝服务商应用管理 API
 */
export const AlipayIsvAppApi = {
  /**
   * 查询服务商应用列表
   */
  listAll(): Promise<Result<AlipayIsvApp[]>> {
    return defHttp.get({ url: '/admin/alipay/isv-app/list-all' });
  },
  /**
   * 查询应用详情
   */
  findById(id: string): Promise<Result<AlipayIsvApp>> {
    return defHttp.get({ url: '/admin/alipay/isv-app/find-by-id', params: { id } });
  },
  /**
   * 支付宝应用 ID 是否已存在（新增）
   */
  existsAliAppId(aliAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/alipay/isv-app/exists-ali-app-id',
      params: { aliAppId },
    });
  },
  /**
   * 支付宝应用 ID 是否已存在（编辑，排除自身）
   */
  existsAliAppIdNotId(aliAppId: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/alipay/isv-app/exists-ali-app-id-not-id',
      params: { aliAppId, id },
    });
  },
  /**
   * 新增服务商应用
   */
  add(data: AlipayIsvApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/isv-app/add', data });
  },
  /**
   * 修改服务商应用
   */
  update(data: AlipayIsvApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/isv-app/update', data });
  },
  /**
   * 删除服务商应用
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/isv-app/delete', params: { id } });
  },
  /**
   * 查询应用密钥配置
   */
  findKeyConfigByAlipayIsvAppId(alipayIsvAppId: string): Promise<Result<AlipayIsvAppKeyConfig>> {
    return defHttp.get({
      url: '/admin/alipay/isv-app/find-key-config-by-app-id',
      params: { alipayIsvAppId },
    });
  },
  /**
   * 保存应用密钥配置
   */
  saveKeyConfig(data: AlipayIsvAppKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/isv-app/save-key-config', data });
  },
  /**
   * 查询应用授权认证配置
   */
  findAuthConfigByAlipayIsvAppId(alipayIsvAppId: string): Promise<Result<AlipayIsvAppAuthConfig>> {
    return defHttp.get({
      url: '/admin/alipay/isv-app/find-auth-config-by-app-id',
      params: { alipayIsvAppId },
    });
  },
  /**
   * 保存应用授权认证配置
   */
  saveAuthConfig(data: AlipayIsvAppAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/isv-app/save-auth-config', data });
  },
};

/** 支付宝服务商应用 */
export interface AlipayIsvApp extends BaseEntity {
  /** 应用名称 */
  appName?: string;
  /** 支付宝应用ID */
  aliAppId?: string;
}

/** 支付宝服务商应用密钥配置 */
export interface AlipayIsvAppKeyConfig {
  /** 应用ID */
  alipayIsvAppId?: string;
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
  /** AES通信密钥 */
  secretKey?: string;
}

/** 支付宝服务商应用授权认证配置 */
export interface AlipayIsvAppAuthConfig {
  /** 应用ID */
  alipayIsvAppId?: string;
  /** 用户标识类型 */
  userIdType?: string;
}
