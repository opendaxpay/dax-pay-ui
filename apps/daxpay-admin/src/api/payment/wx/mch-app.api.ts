import type { MchEntity, Result } from '#/types/web';

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
};

/** 商户微信应用 */
export interface WxMchApp extends MchEntity {
  /** 应用名称 */
  appName?: string;
  /** 应用类型 */
  appType?: string;
  /** 微信应用 AppId */
  wxAppId?: string;
  /** 应用密钥（编辑时脱敏回显，未改不传） */
  appSecret?: string;
}
