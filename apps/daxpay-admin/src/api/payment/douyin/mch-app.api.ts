import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户抖音应用 API（跨通道主数据）
 */
export const DyMchAppApi = {
  /** 按商户号查询应用列表 */
  listByMchNo(mchNo: string): Promise<Result<DyMchApp[]>> {
    return defHttp.get({ url: '/admin/douyin/mch-app/list-by-mch-no', params: { mchNo } });
  },
  /** 查询应用详情 */
  findById(id: string): Promise<Result<DyMchApp>> {
    return defHttp.get({ url: '/admin/douyin/mch-app/find-by-id', params: { id } });
  },
  /** 同商户下抖音 AppId 是否已存在（新增） */
  existsDouyinAppId(mchNo: string, douyinAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/douyin/mch-app/exists-douyin-app-id',
      params: { mchNo, douyinAppId },
    });
  },
  /** 同商户下抖音 AppId 是否已存在（编辑，排除自身） */
  existsDouyinAppIdNotId(mchNo: string, douyinAppId: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/douyin/mch-app/exists-douyin-app-id-not-id',
      params: { mchNo, douyinAppId, id },
    });
  },
  /** 新增商户应用 */
  add(data: DyMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/mch-app/add', data });
  },
  /** 修改商户应用 */
  update(data: DyMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/mch-app/update', data });
  },
  /** 删除商户应用 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/mch-app/delete', params: { id } });
  },
};

/** 商户抖音应用 */
export interface DyMchApp extends MchEntity {
  /** 应用名称 */
  appName?: string;
  /** 应用类型 */
  appType?: string;
  /** 抖音应用 AppId */
  douyinAppId?: string;
  /** 应用密钥（编辑时脱敏回显，未改不传） */
  appSecret?: string;
}
