import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 云音响设备 API
 */
export const IotSpeakerDeviceApi = {
  /**
   * 分页查询云音响设备
   */
  page(
    params: IotSpeakerDeviceQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<IotSpeakerDeviceResult>>> {
    return defHttp.get({ url: '/admin/iot/speaker-device/page', params });
  },

  /**
   * 根据 id 查询云音响设备
   */
  get(id: string): Promise<Result<IotSpeakerDeviceResult>> {
    return defHttp.get({ url: '/admin/iot/speaker-device/get', params: { id } });
  },

  /**
   * 新增云音响设备
   */
  add(data: IotSpeakerDeviceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/iot/speaker-device/add', data });
  },

  /**
   * 修改云音响设备
   */
  update(data: IotSpeakerDeviceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/iot/speaker-device/update', data });
  },

  /**
   * 删除云音响设备
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/iot/speaker-device/delete', params: { id } });
  },

  /**
   * 绑定云音响设备(首期仅更新本地状态, 真实商米对接由独立服务完成)
   */
  bind(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/iot/speaker-device/bind', params: { id } });
  },

  /**
   * 解绑云音响设备
   */
  unbind(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/iot/speaker-device/unbind', params: { id } });
  },
};

/** 云音响设备查询参数 */
export interface IotSpeakerDeviceQuery {
  /** 商户号 */
  mchNo?: string;
  /** 设备序列号 */
  deviceSn?: string;
  /** 设备名称 */
  deviceName?: string;
  /** 商米门店ID */
  shopId?: string;
  /** 设备状态 unbound/online/offline/fault */
  status?: string;
}

/** 云音响设备参数 */
export interface IotSpeakerDeviceParam {
  /** 主键 */
  id?: string;
  /** 商户号 */
  mchNo?: string;
  /** 设备序列号 */
  deviceSn?: string;
  /** 设备IMEI */
  imei?: string;
  /** 商米门店ID */
  shopId?: string;
  /** 设备名称 */
  deviceName?: string;
  /** 备注 */
  remark?: string;
}

/** 云音响设备结果 */
export interface IotSpeakerDeviceResult extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
  /** 设备序列号 */
  deviceSn?: string;
  /** 设备IMEI */
  imei?: string;
  /** 商米门店ID */
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
