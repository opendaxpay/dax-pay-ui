import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户设备与应用计数 API(运营端)
 *
 * 对接后端 /admin/dashboard/device/counts, 供商户工作台「收银与设备」「支付配置」磁贴数字角标使用。
 * 计数为存量总数(只过滤逻辑删除, 不按启用/激活状态过滤), 平台级共享资源不计入。
 */
export const DashboardDeviceApi = {
  /**
   * 指定商户的设备与支付应用计数
   * @param mchNo 商户号
   */
  deviceCounts(mchNo: string): Promise<Result<MchDeviceCountResult>> {
    // 角标为辅助信息, 拉取失败不弹全局提示(silentError), 仅缺省不展示
    return defHttp.get({ url: '/admin/dashboard/device/counts', params: { mchNo }, silentError: true });
  },
};

/**
 * 商户设备与应用计数结果
 */
export interface MchDeviceCountResult {
  /** 名下虚拟设备台数 */
  virtualDeviceCount?: number;
  /** 商户微信应用数 */
  wxAppCount?: number;
  /** 商户抖音应用数 */
  dyAppCount?: number;
}
