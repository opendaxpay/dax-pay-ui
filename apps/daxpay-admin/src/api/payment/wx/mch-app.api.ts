import type { BaseEntity, MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户微信应用 API（跨通道主数据）
 */
export const WxMchAppApi = {
  /** 按商户号查询应用列表 */
  listByMchNo(mchNo: string): Promise<Result<WxMchApp[]>> {
    return defHttp.get({ url: '/admin/wx/mch-app/list-by-mch-no', params: { mchNo } });
  },
  /** 查询应用详情 */
  findById(id: string): Promise<Result<WxMchApp>> {
    return defHttp.get({ url: '/admin/wx/mch-app/find-by-id', params: { id } });
  },
  /** 同商户下微信 AppId 是否已存在（新增） */
  existsWxAppId(mchNo: string, wxAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/wx/mch-app/exists-wx-app-id',
      params: { mchNo, wxAppId },
    });
  },
  /** 同商户下微信 AppId 是否已存在（编辑，排除自身） */
  existsWxAppIdNotId(mchNo: string, wxAppId: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/wx/mch-app/exists-wx-app-id-not-id',
      params: { mchNo, wxAppId, id },
    });
  },
  /** 新增商户应用 */
  add(data: WxMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wx/mch-app/add', data });
  },
  /** 修改商户应用 */
  update(data: WxMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wx/mch-app/update', data });
  },
  /** 删除商户应用 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wx/mch-app/delete', params: { id } });
  },
  /** 查询应用授权认证配置 */
  findAuthConfigByAppId(wxMchAppId: string): Promise<Result<WxMchAppAuthConfig>> {
    return defHttp.get({
      url: '/admin/wx/mch-app/find-auth-config-by-app-id',
      params: { wxMchAppId },
    });
  },
  /** 保存应用授权认证配置 */
  saveAuthConfig(data: WxMchAppAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wx/mch-app/save-auth-config', data });
  },
};

/** 商户微信应用 */
export interface WxMchApp extends MchEntity {
  /** 应用名称 */
  appName?: string;
  /** 应用类型 */
  appType?: string;
  /** 微信应用 AppId */
  wxAppId?: string;
}

/** 商户微信应用授权认证配置 */
export interface WxMchAppAuthConfig extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
  /** 商户应用ID */
  wxMchAppId?: string;
  /** 应用密钥（已脱敏） */
  appSecret?: string;
}
