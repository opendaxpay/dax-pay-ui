import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 移动端应用配置 API（平台级, 按端类型+移动平台维度）
 */
export const MobileAppApi = {
  /**
   * 查询全部(按端类型分组)
   */
  list(): Promise<Result<MobileAppResult[]>> {
    return defHttp.get({ url: '/admin/mobile-app/list' });
  },

  /**
   * 按端类型查询所有平台配置
   */
  listByAppType(appType: string): Promise<Result<MobileAppResult[]>> {
    return defHttp.get({
      url: '/admin/mobile-app/list-by-app-type',
      params: { appType },
    });
  },

  /**
   * 查询单条详情
   */
  findById(id: string): Promise<Result<MobileAppResult>> {
    return defHttp.get({ url: '/admin/mobile-app/get', params: { id } });
  },

  /**
   * 保存(按端类型+平台 upsert)
   */
  save(param: MobileAppParam): Promise<Result<MobileAppResult>> {
    return defHttp.post({ url: '/admin/mobile-app/save', data: param });
  },

  /**
   * 更新启用状态
   */
  updateEnabled(id: string, enable: boolean): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/mobile-app/update-enabled',
      params: { id, enable },
    });
  },
};

/** 移动端应用配置结果 */
export interface MobileAppResult extends BaseEntity {
  /** 端类型: merchant/admin/cashier */
  appType?: string;
  /** 移动平台: wx_h5/wx_mini/alipay_mini/dy_mini/android/ios */
  platform?: string;
  /** 应用名称 */
  appName?: string;
  /** 平台特有密钥配置(JSON文本, 敏感字段脱敏) */
  appConfig?: string;
  /** 消息通知配置(JSON文本) */
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
  /** 应用名称 */
  appName?: string;
  /** 平台特有密钥配置(JSON文本) */
  appConfig?: string;
  /** 消息通知配置(JSON文本) */
  notifyConfig?: string;
  /** 是否启用第三方账号用户绑定 */
  bindingEnabled?: boolean;
  /** 是否启用 */
  enabled?: boolean;
  /** 备注 */
  remark?: string;
}
