import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 抖音通道商户应用管理 API
 */
export const DouyinMchAppApi = {
  /** 查询通道商户应用列表 */
  listByChannelMchNo(mchNo: string, channelMchNo: string): Promise<Result<DouyinMchApp[]>> {
    return defHttp.get({
      url: '/admin/douyin/mch-app/list-by-channel-mch-no',
      params: { mchNo, channelMchNo },
    });
  },
  /** 查询应用详情 */
  findById(id: string): Promise<Result<DouyinMchApp>> {
    return defHttp.get({ url: '/admin/douyin/mch-app/find-by-id', params: { id } });
  },
  /** 同一通道商户下抖音 AppId 是否已存在（新增） */
  existsDouyinAppId(mchNo: string, channelMchNo: string, douyinAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/douyin/mch-app/exists-douyin-app-id-by-channel',
      params: { mchNo, channelMchNo, douyinAppId },
    });
  },
  /** 同一通道商户下抖音 AppId 是否已存在（编辑，排除自身） */
  existsDouyinAppIdNotId(
    mchNo: string,
    channelMchNo: string,
    douyinAppId: string,
    id: string,
  ): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/douyin/mch-app/exists-douyin-app-id-by-channel-not-id',
      params: { mchNo, channelMchNo, douyinAppId, id },
    });
  },
  /** 新增通道商户应用 */
  add(data: DouyinMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/mch-app/add', data });
  },
  /** 修改通道商户应用 */
  update(data: DouyinMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/mch-app/update', data });
  },
  /** 删除通道商户应用 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/mch-app/delete', params: { id } });
  },
  /** 查询应用授权认证配置 */
  findAuthConfigByAppId(douyinDirectAppId: string): Promise<Result<DouyinMchAppAuthConfig>> {
    return defHttp.get({
      url: '/admin/douyin/mch-app/find-auth-config-by-app-id',
      params: { douyinDirectAppId },
    });
  },
  /** 保存应用授权认证配置 */
  saveAuthConfig(data: DouyinMchAppAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/mch-app/save-auth-config', data });
  },
};

/** 抖音通道商户应用 */
export interface DouyinMchApp extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 应用名称 */
  appName?: string;
  /** 抖音应用 AppId(APPID) */
  douyinAppId?: string;
  /** 应用类型: mini_program-小程序 mobile_app-移动应用 web_app-网站应用 */
  appType?: string;
}

/** 抖音通道商户应用授权认证配置 */
export interface DouyinMchAppAuthConfig {
  /** 应用ID */
  douyinDirectAppId?: string;
  /** 商户号 */
  mchNo?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 应用密钥 (已脱敏) */
  appSecret?: string;
}
