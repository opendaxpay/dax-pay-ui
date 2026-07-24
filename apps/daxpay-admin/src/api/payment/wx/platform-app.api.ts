import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 平台微信应用 API（跨通道主数据）
 */
export const WxPlatformAppApi = {
  /** 查询平台应用列表 */
  listAll(): Promise<Result<WxPlatformApp[]>> {
    return defHttp.get({ url: '/admin/wx/platform-app/list-all' });
  },
  /** 查询应用详情 */
  findById(id: string): Promise<Result<WxPlatformApp>> {
    return defHttp.get({ url: '/admin/wx/platform-app/find-by-id', params: { id } });
  },
  /** 微信 AppId 是否已存在（新增） */
  existsWxAppId(wxAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/wx/platform-app/exists-wx-app-id',
      params: { wxAppId },
    });
  },
  /** 微信 AppId 是否已存在（编辑，排除自身） */
  existsWxAppIdNotId(wxAppId: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/wx/platform-app/exists-wx-app-id-not-id',
      params: { wxAppId, id },
    });
  },
  /** 新增平台应用 */
  add(data: WxPlatformApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wx/platform-app/add', data });
  },
  /** 修改平台应用 */
  update(data: WxPlatformApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wx/platform-app/update', data });
  },
  /** 删除平台应用 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wx/platform-app/delete', params: { id } });
  },
  /** 查询应用授权认证配置 */
  findAuthConfigByAppId(wxPlatformAppId: string): Promise<Result<WxPlatformAppAuthConfig>> {
    return defHttp.get({
      url: '/admin/wx/platform-app/find-auth-config-by-app-id',
      params: { wxPlatformAppId },
    });
  },
  /** 保存应用授权认证配置 */
  saveAuthConfig(data: WxPlatformAppAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wx/platform-app/save-auth-config', data });
  },
};

/** 平台微信应用 */
export interface WxPlatformApp extends BaseEntity {
  /** 应用名称 */
  appName?: string;
  /** 应用类型 */
  appType?: string;
  /** 微信应用 AppId */
  wxAppId?: string;
}

/** 平台微信应用授权认证配置 */
export interface WxPlatformAppAuthConfig {
  /** 平台应用ID */
  wxPlatformAppId?: string;
  /** 应用密钥（已脱敏） */
  appSecret?: string;
}
