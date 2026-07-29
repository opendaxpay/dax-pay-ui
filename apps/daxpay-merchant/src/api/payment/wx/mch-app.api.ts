import type { MchEntity, Result } from '#/types/web';

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
};

/** 商户微信应用 */
export interface WxMchApp extends MchEntity {
  appName?: string;
  appType?: string;
  wxAppId?: string;
  /** 应用密钥（编辑时脱敏回显，未改不传） */
  appSecret?: string;
}
