import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信服务商通道商户应用(子商户应用)管理 API
 */
export const WechatIsvMchAppApi = {
  /** 查询通道商户应用列表 */
  listByChannelMchNo(mchNo: string, channelMchNo: string): Promise<Result<WechatIsvMchApp[]>> {
    return defHttp.get({
      url: '/admin/wechat/isv-mch-app/list-by-channel-mch-no',
      params: { mchNo, channelMchNo },
    });
  },
  /** 查询应用详情 */
  findById(id: string): Promise<Result<WechatIsvMchApp>> {
    return defHttp.get({ url: '/admin/wechat/isv-mch-app/find-by-id', params: { id } });
  },
  /** 同一通道商户下微信 AppId 是否已存在（新增） */
  existsWxAppId(mchNo: string, channelMchNo: string, wxAppId: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/wechat/isv-mch-app/exists-wx-app-id-by-channel',
      params: { mchNo, channelMchNo, wxAppId },
    });
  },
  /** 同一通道商户下微信 AppId 是否已存在（编辑，排除自身） */
  existsWxAppIdNotId(mchNo: string, channelMchNo: string, wxAppId: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({
      url: '/admin/wechat/isv-mch-app/exists-wx-app-id-by-channel-not-id',
      params: { mchNo, channelMchNo, wxAppId, id },
    });
  },
  /** 新增通道商户应用 */
  add(data: WechatIsvMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-mch-app/add', data });
  },
  /** 修改通道商户应用 */
  update(data: WechatIsvMchApp): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-mch-app/update', data });
  },
  /** 删除通道商户应用 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-mch-app/delete', params: { id } });
  },
  /** 查询应用授权认证配置 */
  findAuthConfigByWechatIsvMchAppId(wechatIsvMchAppId: string): Promise<Result<WechatIsvMchAppAuthConfig>> {
    return defHttp.get({
      url: '/admin/wechat/isv-mch-app/find-auth-config-by-app-id',
      params: { wechatIsvMchAppId },
    });
  },
  /** 保存应用授权认证配置 */
  saveAuthConfig(data: WechatIsvMchAppAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-mch-app/save-auth-config', data });
  },
};

/** 微信服务商通道商户应用 */
export interface WechatIsvMchApp extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 应用名称 */
  appName?: string;
  /** 应用类型 */
  appType?: string;
  /** 微信应用 AppId */
  wxAppId?: string;
}

/** 微信服务商通道商户应用授权认证配置 */
export interface WechatIsvMchAppAuthConfig {
  /** 应用ID */
  wechatIsvMchAppId?: string;
  /** 商户号 */
  mchNo?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 应用密钥（已脱敏） */
  appSecret?: string;
}
