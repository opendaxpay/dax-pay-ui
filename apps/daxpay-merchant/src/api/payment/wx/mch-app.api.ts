import type { BaseEntity, MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户端微信应用 API（当前登录商户，路径 /mch/wx/mch-app）
 */
export const WxMchAppApi = {
  /** 当前商户应用列表 */
  listAll(): Promise<Result<WxMchApp[]>> {
    return defHttp.get({ url: '/mch/wx/mch-app/list-all' });
  },
  /** 查询应用详情 */
  findById(id: string): Promise<Result<WxMchApp>> {
    return defHttp.get({ url: '/mch/wx/mch-app/find-by-id', params: { id } });
  },
  /** 微信 AppId 是否已存在（新增） */
  existsWxAppId(wxAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/mch/wx/mch-app/exists-wx-app-id',
      params: { wxAppId },
    });
  },
  /** 微信 AppId 是否已存在（编辑，排除自身） */
  existsWxAppIdNotId(wxAppId: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/mch/wx/mch-app/exists-wx-app-id-not-id',
      params: { wxAppId, id },
    });
  },
  /** 新增 */
  add(data: WxMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/wx/mch-app/add', data });
  },
  /** 修改 */
  update(data: WxMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/wx/mch-app/update', data });
  },
  /** 删除 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/wx/mch-app/delete', params: { id } });
  },
  /** 查询授权认证配置 */
  findAuthConfigByAppId(wxMchAppId: string): Promise<Result<WxMchAppAuthConfig>> {
    return defHttp.get({
      url: '/mch/wx/mch-app/find-auth-config-by-app-id',
      params: { wxMchAppId },
    });
  },
  /** 保存授权认证配置 */
  saveAuthConfig(data: WxMchAppAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/wx/mch-app/save-auth-config', data });
  },
};

/** 商户微信应用 */
export interface WxMchApp extends MchEntity {
  appName?: string;
  appType?: string;
  wxAppId?: string;
}

/** 商户微信应用授权认证配置 */
export interface WxMchAppAuthConfig extends BaseEntity {
  mchNo?: string;
  wxMchAppId?: string;
  appSecret?: string;
}
