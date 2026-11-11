import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 应用收款播报配置 API(运营端 /admin/merchant/app/device-config/*)
 *
 * 一应用一行极简配置: 播报开关 + 打印开关 + 内置打印版式代码(首期仅 standard 标准小票)
 * + 门店订单严格匹配开关(默认关, 关=未绑门店设备视为商户通用);
 * 保存后对该应用的收款成功联动生效(线上单静音等来源判断由后端处理)。
 */
export const AppDeviceConfigApi = {
  /**
   * 查询应用收款播报配置(未初始化时返回默认值)
   */
  simpleGet(appId: string): Promise<Result<AppDeviceConfigResult>> {
    return defHttp.get({
      url: '/admin/merchant/app/device-config/simple-get',
      params: { appId },
    });
  },

  /**
   * 保存应用收款播报配置
   */
  simpleSave(data: AppDeviceConfigParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/merchant/app/device-config/simple-save',
      data,
    });
  },
};

/** 应用收款播报配置结果 */
export interface AppDeviceConfigResult extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
  /** 应用号 */
  appId?: string;
  /** 应用名称 */
  appName?: string;
  /** 语音播报开关(收款到账后店内播报) */
  broadcastEnable?: boolean;
  /** 小票打印开关(收款到账后自动打印) */
  printEnable?: boolean;
  /** 打印版式代码(内置版式, 首期仅 standard 标准小票) */
  templateCode?: string;
  /** 门店订单严格匹配(true=门店订单仅推绑定该门店的设备; false=未绑门店设备视为商户通用照常推送, 默认 false) */
  storeStrictMatch?: boolean;
}

/** 应用收款播报配置保存参数 */
export interface AppDeviceConfigParam {
  /** 应用号 */
  appId: string;
  /** 语音播报开关(收款到账后店内播报) */
  broadcastEnable?: boolean;
  /** 小票打印开关(收款到账后自动打印) */
  printEnable?: boolean;
  /** 打印版式代码(内置版式, 首期仅 standard 标准小票) */
  templateCode?: string;
  /** 门店订单严格匹配(true=门店订单仅推绑定该门店的设备; false=未绑门店设备视为商户通用照常推送, 默认 false) */
  storeStrictMatch?: boolean;
}
