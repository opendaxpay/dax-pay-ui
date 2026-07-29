import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户端抖音应用 API（当前登录商户，路径 /mch/douyin/mch-app）
 */
export const DyMchAppApi = {
  /** 当前商户应用列表 */
  listAll(): Promise<Result<DyMchApp[]>> {
    return defHttp.get({ url: '/mch/douyin/mch-app/list-all' });
  },
  /** 查询应用详情 */
  findById(id: string): Promise<Result<DyMchApp>> {
    return defHttp.get({ url: '/mch/douyin/mch-app/find-by-id', params: { id } });
  },
  /** 抖音 AppId 是否已存在（新增） */
  existsDouyinAppId(douyinAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/mch/douyin/mch-app/exists-douyin-app-id',
      params: { douyinAppId },
    });
  },
  /** 抖音 AppId 是否已存在（编辑，排除自身） */
  existsDouyinAppIdNotId(douyinAppId: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/mch/douyin/mch-app/exists-douyin-app-id-not-id',
      params: { douyinAppId, id },
    });
  },
  /** 新增 */
  add(data: DyMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/douyin/mch-app/add', data });
  },
  /** 修改 */
  update(data: DyMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/douyin/mch-app/update', data });
  },
  /** 删除 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/douyin/mch-app/delete', params: { id } });
  },
};

/** 商户抖音应用 */
export interface DyMchApp extends MchEntity {
  appName?: string;
  appType?: string;
  douyinAppId?: string;
  /** 应用密钥（编辑时脱敏回显，未改不传） */
  appSecret?: string;
}
