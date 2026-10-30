import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 应用收款播报配置 API(运营端, 应用编辑弹窗「收款播报」区块)
 *
 * 简版: 一应用一行, 播报/打印两个布尔开关 + 内置版式代码(首期仅 standard) + 门店订单严格匹配开关(默认关),
 * 无联动规则。
 */
export const AppDeviceConfigApi = {
  /**
   * 查询应用收款播报配置
   */
  getSimpleConfig(appId: string): Promise<Result<AppDeviceSimpleConfigResult>> {
    return defHttp.get({
      url: '/admin/merchant/app/device-config/simple-get',
      params: { appId },
    });
  },

  /**
   * 保存应用收款播报配置
   */
  saveSimple(data: AppDeviceSimpleConfigParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/merchant/app/device-config/simple-save',
      data,
    });
  },
};

/**
 * 应用收款播报配置结果
 */
export interface AppDeviceSimpleConfigResult {
  /** 应用ID */
  appId?: string;
  /** 语音播报开关 */
  broadcastEnable?: boolean;
  /** 小票打印开关 */
  printEnable?: boolean;
  /** 打印版式代码(内置枚举, 默认 standard) */
  templateCode?: string;
  /** 门店订单严格匹配(true=门店订单仅推绑定该门店的设备; false=未绑门店设备视为商户通用照常推送, 默认 false) */
  storeStrictMatch?: boolean;
}

/**
 * 应用收款播报配置保存参数
 */
export interface AppDeviceSimpleConfigParam {
  /** 应用ID */
  appId: string;
  /** 语音播报开关 */
  broadcastEnable?: boolean;
  /** 小票打印开关 */
  printEnable?: boolean;
  /** 打印版式代码(内置枚举, 默认 standard) */
  templateCode?: string;
  /** 门店订单严格匹配(true=门店订单仅推绑定该门店的设备; false=未绑门店设备视为商户通用照常推送, 默认 false) */
  storeStrictMatch?: boolean;
}
