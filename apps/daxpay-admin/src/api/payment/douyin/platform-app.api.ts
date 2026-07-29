import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 平台抖音应用 API（跨通道主数据）
 */
export const DyPlatformAppApi = {
  /** 查询平台应用列表 */
  listAll(): Promise<Result<DyPlatformApp[]>> {
    return defHttp.get({ url: '/admin/douyin/platform-app/list-all' });
  },
  /** 查询应用详情 */
  findById(id: string): Promise<Result<DyPlatformApp>> {
    return defHttp.get({ url: '/admin/douyin/platform-app/find-by-id', params: { id } });
  },
  /** 抖音 AppId 是否已存在（新增） */
  existsDouyinAppId(douyinAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/douyin/platform-app/exists-douyin-app-id',
      params: { douyinAppId },
    });
  },
  /** 抖音 AppId 是否已存在（编辑，排除自身） */
  existsDouyinAppIdNotId(douyinAppId: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/douyin/platform-app/exists-douyin-app-id-not-id',
      params: { douyinAppId, id },
    });
  },
  /** 新增平台应用 */
  add(data: DyPlatformApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/platform-app/add', data });
  },
  /** 修改平台应用 */
  update(data: DyPlatformApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/platform-app/update', data });
  },
  /** 删除平台应用 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/platform-app/delete', params: { id } });
  },
  /** 查询应用授权认证配置 */
  findAuthConfigByAppId(dyPlatformAppId: string): Promise<Result<DyPlatformAppAuthConfig>> {
    return defHttp.get({
      url: '/admin/douyin/platform-app/find-auth-config-by-app-id',
      params: { dyPlatformAppId },
    });
  },
  /** 保存应用授权认证配置 */
  saveAuthConfig(data: DyPlatformAppAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/platform-app/save-auth-config', data });
  },
};

/** 平台抖音应用 */
export interface DyPlatformApp extends BaseEntity {
  /** 应用名称 */
  appName?: string;
  /** 应用类型 */
  appType?: string;
  /** 抖音应用 AppId */
  douyinAppId?: string;
}

/** 平台抖音应用授权认证配置 */
export interface DyPlatformAppAuthConfig {
  /** 平台应用ID */
  dyPlatformAppId?: string;
  /** 应用密钥（已脱敏） */
  appSecret?: string;
}
