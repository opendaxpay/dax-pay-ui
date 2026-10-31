import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 工作台设备与应用计数 API(商户端)
 *
 * 对接后端 /mch/dashboard/device/counts, 供应用工作台「通知与设备」磁贴数字角标使用;
 * 商户号由后端登录态强制隔离。计数为存量总数(只过滤逻辑删除, 不按启用/激活状态过滤)。
 */
export const DashboardDeviceApi = {
  /**
   * 设备与应用计数(虚拟设备/微信应用/抖音应用)
   */
  deviceCounts(): Promise<Result<MchDeviceCountResult>> {
    return defHttp.get({ url: '/mch/dashboard/device/counts' });
  },
};

/** 设备与应用计数结果(各计数后端一律返回数字, null 视为无数据不渲染数量标签) */
export interface MchDeviceCountResult {
  /** 名下虚拟设备台数 */
  virtualDeviceCount?: number;
  /** 商户微信应用数 */
  wxAppCount?: number;
  /** 商户抖音应用数 */
  dyAppCount?: number;
}
