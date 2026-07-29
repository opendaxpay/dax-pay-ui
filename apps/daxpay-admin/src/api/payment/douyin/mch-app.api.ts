import type { BaseEntity, MchEntity, Result } from '#/types/web';

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
  /** 查询应用授权认证配置 */
  findAuthConfigByAppId(dyMchAppId: string): Promise<Result<DyMchAppAuthConfig>> {
    return defHttp.get({
      url: '/admin/douyin/mch-app/find-auth-config-by-app-id',
      params: { dyMchAppId },
    });
  },
  /** 保存应用授权认证配置 */
  saveAuthConfig(data: DyMchAppAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/mch-app/save-auth-config', data });
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
}

/** 商户抖音应用授权认证配置 */
export interface DyMchAppAuthConfig extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
  /** 商户应用ID */
  dyMchAppId?: string;
  /** 应用密钥（已脱敏） */
  appSecret?: string;
}
