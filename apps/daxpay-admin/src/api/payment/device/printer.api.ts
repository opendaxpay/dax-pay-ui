import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 云打印设备 API
 */
export const DevicePrinterApi = {
  /**
   * 分页查询云打印设备
   */
  page(
    params: DevicePrinterQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<DevicePrinterResult>>> {
    return defHttp.get({ url: '/admin/device/printer/page', params });
  },

  /**
   * 根据 id 查询云打印设备
   */
  get(id: string): Promise<Result<DevicePrinterResult>> {
    return defHttp.get({ url: '/admin/device/printer/get', params: { id } });
  },

  /**
   * 新增云打印设备
   */
  add(data: DevicePrinterParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/printer/add', data });
  },

  /**
   * 修改云打印设备
   */
  update(data: DevicePrinterParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/printer/update', data });
  },

  /**
   * 删除云打印设备
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/printer/delete', params: { id } });
  },

  /**
   * 绑定云打印设备(首期仅更新本地状态, 真实设备对接由独立服务完成)
   */
  bind(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/printer/bind', params: { id } });
  },

  /**
   * 解绑云打印设备
   */
  unbind(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/printer/unbind', params: { id } });
  },
};

/** 云打印设备查询参数 */
export interface DevicePrinterQuery {
  /** 商户号 */
  mchNo?: string;
  /** 厂商代码 */
  vendorCode?: string;
  /** 设备序列号 */
  deviceSn?: string;
  /** 设备名称 */
  deviceName?: string;
  /** 厂商门店ID */
  shopId?: string;
  /** 设备状态 unbound/online/offline/fault */
  status?: string;
}

/** 云打印设备参数 */
export interface DevicePrinterParam {
  /** 主键 */
  id?: string;
  /** 商户号 */
  mchNo?: string;
  /** 厂商代码 */
  vendorCode?: string;
  /** 厂商配置ID */
  vendorConfigId?: string;
  /** 设备序列号 */
  deviceSn?: string;
  /** 设备IMEI */
  imei?: string;
  /** 厂商门店ID */
  shopId?: string;
  /** 设备名称 */
  deviceName?: string;
  /** 备注 */
  remark?: string;
}

/** 云打印设备结果 */
export interface DevicePrinterResult extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
  /** 厂商代码 */
  vendorCode?: string;
  /** 厂商配置ID */
  vendorConfigId?: string;
  /** 设备序列号 */
  deviceSn?: string;
  /** 设备IMEI */
  imei?: string;
  /** 厂商门店ID */
  shopId?: string;
  /** 设备名称 */
  deviceName?: string;
  /** 设备状态 */
  status?: string;
  /** 绑定时间 */
  bindTime?: string;
  /** 最后在线时间 */
  lastOnlineTime?: string;
  /** 备注 */
  remark?: string;
}
