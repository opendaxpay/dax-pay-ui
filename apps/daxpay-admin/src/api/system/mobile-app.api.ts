import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 移动端应用配置 API（平台级, 按端类型+移动平台维度）
 * 平台密钥以嵌套强类型对象提交/回显, 不再透传 appConfig JSON 字符串
 */
export const MobileAppApi = {
  /**
   * 查询全部(按端类型分组)
   */
  list(): Promise<Result<MobileAppResult[]>> {
    return defHttp.get({ url: '/platform/config/mobile-app/list' });
  },

  /**
   * 按端类型查询所有平台配置
   */
  listByAppType(appType: string): Promise<Result<MobileAppResult[]>> {
    return defHttp.get({
      url: '/platform/config/mobile-app/list-by-app-type',
      params: { appType },
    });
  },

  /**
   * 查询单条详情
   */
  findById(id: string): Promise<Result<MobileAppResult>> {
    return defHttp.get({
      url: '/platform/config/mobile-app/get',
      params: { id },
    });
  },

  /**
   * 按端类型+平台查询
   */
  findByAppTypeAndPlatform(
    appType: string,
    platform: string,
  ): Promise<Result<MobileAppResult | null>> {
    return defHttp.get({
      url: '/platform/config/mobile-app/get-by-type-platform',
      params: { appType, platform },
    });
  },

  /**
   * 保存(按端类型+平台 upsert)
   */
  save(param: MobileAppParam): Promise<Result<MobileAppResult>> {
    return defHttp.post({
      url: '/platform/config/mobile-app/save',
      data: param,
    });
  },

  /**
   * 更新启用状态
   */
  updateEnabled(id: string, enable: boolean): Promise<Result<void>> {
    return defHttp.post({
      url: '/platform/config/mobile-app/update-enabled',
      params: { id, enable },
    });
  },
};

/** 微信小程序配置 */
export interface WxMiniAppConfig {
  appId?: string;
  appSecret?: string;
  originalId?: string;
}

/** 支付宝小程序配置 */
export interface AlipayMiniAppConfig {
  appId?: string;
  authType?: string;
  privateKey?: string;
  alipayPublicKey?: string;
  appCert?: string;
  alipayCert?: string;
  alipayRootCert?: string;
}

/** 抖音小程序配置 */
export interface DyMiniAppConfig {
  appId?: string;
  appSecret?: string;
}

/** 移动端应用配置结果 */
export interface MobileAppResult extends BaseEntity {
  /** 端类型: merchant/admin/cashier */
  appType?: string;
  /** 移动平台: wx_h5/wx_mini/alipay_mini/dy_mini/android/ios */
  platform?: string;
  /** 微信小程序配置 */
  wxMini?: WxMiniAppConfig;
  /** 支付宝小程序配置 */
  alipayMini?: AlipayMiniAppConfig;
  /** 抖音小程序配置 */
  dyMini?: DyMiniAppConfig;
  /** 消息通知配置(jsonb 原始JSON文本, 明文非敏感) */
  notifyConfig?: string;
  /** 是否启用第三方账号用户绑定 */
  bindingEnabled?: boolean;
  /** 是否启用 */
  enabled?: boolean;
  /** 备注 */
  remark?: string;
}

/** 移动端应用配置保存参数 */
export interface MobileAppParam {
  /** 主键(更新时传) */
  id?: string;
  /** 端类型 */
  appType?: string;
  /** 移动平台 */
  platform?: string;
  /** 微信小程序配置(platform=wx_mini) */
  wxMini?: WxMiniAppConfig;
  /** 支付宝小程序配置(platform=alipay_mini) */
  alipayMini?: AlipayMiniAppConfig;
  /** 抖音小程序配置(platform=dy_mini) */
  dyMini?: DyMiniAppConfig;
  /** 消息通知配置 */
  notifyConfig?: string;
  /** 是否启用第三方账号用户绑定 */
  bindingEnabled?: boolean;
  /** 是否启用 */
  enabled?: boolean;
  /** 备注 */
  remark?: string;
}
