import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户应用事件通知配置 API（商户端）
 */
export const MchAppNotifyConfigApi = {
  /**
   * 根据应用ID查询通知配置
   */
  getByAppId(appId: string): Promise<Result<MchAppNotifyConfigResult>> {
    return defHttp.get({
      url: '/mch/merchant/app-notify-config/get-by-app-id',
      params: { appId },
    });
  },

  /**
   * 保存或更新通知配置
   */
  saveOrUpdate(data: MchAppNotifyConfigParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/mch/merchant/app-notify-config/save-or-update',
      data,
    });
  },
};

/**
 * 商户应用事件通知配置结果
 */
export interface MchAppNotifyConfigResult extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
  /** 应用ID */
  appId?: string;
  /** 回调地址 */
  notifyUrl?: string;
  /** 通知方式(http-HTTP异步回调) */
  notifyWay?: string;
  /** 订阅事件类型(逗号分隔) */
  subscribedEvents?: string;
  /** 启用状态 */
  status?: boolean;
  /** 备注 */
  remark?: string;
}

/**
 * 商户应用事件通知配置参数
 */
export interface MchAppNotifyConfigParam {
  /** 应用ID */
  appId: string;
  /** 回调地址 */
  notifyUrl?: string;
  /** 通知方式 */
  notifyWay?: string;
  /** 订阅事件类型(逗号分隔) */
  subscribedEvents?: string;
  /** 启用状态 */
  status?: boolean;
  /** 备注 */
  remark?: string;
}
