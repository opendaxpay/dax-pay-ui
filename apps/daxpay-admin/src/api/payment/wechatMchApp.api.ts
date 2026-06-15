import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信通道商户应用管理 API
 */
export const WechatMchAppApi = {
  /** 查询通道商户应用列表 */
  listByChannelMchNo(mchNo: string, channelMchNo: string): Promise<Result<WechatMchApp[]>> {
    return defHttp.get({
      url: '/admin/wechat/mch-app/list-by-channel-mch-no',
      params: { mchNo, channelMchNo },
    });
  },
  /** 查询应用详情 */
  findById(id: string): Promise<Result<WechatMchApp>> {
    return defHttp.get({ url: '/admin/wechat/mch-app/find-by-id', params: { id } });
  },
  /** 同一通道商户下微信 AppId 是否已存在（新增） */
  existsWxAppId(mchNo: string, channelMchNo: string, wxAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/wechat/mch-app/exists-wx-app-id-by-channel',
      params: { mchNo, channelMchNo, wxAppId },
    });
  },
  /** 同一通道商户下微信 AppId 是否已存在（编辑，排除自身） */
  existsWxAppIdNotId(
    mchNo: string,
    channelMchNo: string,
    wxAppId: string,
    id: string,
  ): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/wechat/mch-app/exists-wx-app-id-by-channel-not-id',
      params: { mchNo, channelMchNo, wxAppId, id },
    });
  },
  /** 新增通道商户应用 */
  add(data: WechatMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/mch-app/add', data });
  },
  /** 修改通道商户应用 */
  update(data: WechatMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/mch-app/update', data });
  },
  /** 删除通道商户应用 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/mch-app/delete', params: { id } });
  },
  /** 查询应用授权认证配置 */
  findAuthConfigByWechatDirectAppId(wechatDirectAppId: string): Promise<Result<WechatMchAppAuthConfig>> {
    return defHttp.get({
      url: '/admin/wechat/mch-app/find-auth-config-by-app-id',
      params: { wechatDirectAppId },
    });
  },
  /** 保存应用授权认证配置 */
  saveAuthConfig(data: WechatMchAppAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/mch-app/save-auth-config', data });
  },
};

/** 微信通道商户应用 */
export interface WechatMchApp extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 应用名称 */
  appName?: string;
  /** 应用类型 */
  appType?: string;
  /** 微信应用 AppId */
  wxAppId?: string;
}

/** 微信通道商户应用授权认证配置 */
export interface WechatMchAppAuthConfig {
  /** 应用ID */
  wechatDirectAppId?: string;
  /** 商户号 */
  mchNo?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 应用密钥 */
  appSecret?: string;
  /** 是否已配置应用密钥 */
  appSecretConfigured?: boolean;
  /** 授权回调地址（仅公众号） */
  authCallbackUrl?: string;
}
