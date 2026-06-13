import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信服务商应用管理 API
 */
export const WechatIsvAppApi = {
  /** 查询服务商应用列表 */
  listAll(): Promise<Result<WechatIsvApp[]>> {
    return defHttp.get({ url: '/admin/wechat/isv-app/list-all' });
  },
  /** 查询应用详情 */
  findById(id: string): Promise<Result<WechatIsvApp>> {
    return defHttp.get({ url: '/admin/wechat/isv-app/find-by-id', params: { id } });
  },
  /** 微信 AppId 是否已存在（新增） */
  existsWxAppId(wxAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/wechat/isv-app/exists-wx-app-id',
      params: { wxAppId },
    });
  },
  /** 微信 AppId 是否已存在（编辑，排除自身） */
  existsWxAppIdNotId(wxAppId: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/wechat/isv-app/exists-wx-app-id-not-id',
      params: { wxAppId, id },
    });
  },
  /** 新增服务商应用 */
  add(data: WechatIsvApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-app/add', data });
  },
  /** 修改服务商应用 */
  update(data: WechatIsvApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-app/update', data });
  },
  /** 删除服务商应用 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-app/delete', params: { id } });
  },
  /** 查询应用授权认证配置 */
  findAuthConfigByAppId(appId: string): Promise<Result<WechatIsvAppAuthConfig>> {
    return defHttp.get({
      url: '/admin/wechat/isv-app/find-auth-config-by-app-id',
      params: { appId },
    });
  },
  /** 保存应用授权认证配置 */
  saveAuthConfig(data: WechatIsvAppAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-app/save-auth-config', data });
  },
};

/** 微信服务商应用 */
export interface WechatIsvApp extends BaseEntity {
  /** 应用名称 */
  appName?: string;
  /** 应用类型 */
  appType?: string;
  /** 微信应用 AppId */
  wxAppId?: string;
}

/** 微信服务商应用授权认证配置 */
export interface WechatIsvAppAuthConfig {
  /** 应用ID */
  appId?: string;
  /** 应用密钥 */
  appSecret?: string;
  /** 是否已配置应用密钥 */
  appSecretConfigured?: boolean;
  /** 授权回调地址（仅公众号） */
  authCallbackUrl?: string;
}
