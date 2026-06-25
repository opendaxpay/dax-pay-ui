import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 云音响设备 API
 */
export const SpeakerDeviceApi = {
  /**
   * 分页查询云音响设备
   */
  page(
    params: SpeakerDeviceQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<SpeakerDeviceResult>>> {
    return defHttp.get({ url: '/admin/device/speaker/page', params });
  },

  /**
   * 根据 id 查询云音响设备
   */
  get(id: string): Promise<Result<SpeakerDeviceResult>> {
    return defHttp.get({ url: '/admin/device/speaker/get', params: { id } });
  },

  /**
   * 新增云音响设备
   */
  add(data: SpeakerDeviceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/speaker/add', data });
  },

  /**
   * 修改云音响设备
   */
  update(data: SpeakerDeviceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/speaker/update', data });
  },

  /**
   * 删除云音响设备
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/speaker/delete', params: { id } });
  },

  /**
   * 绑定云音响设备(首期仅更新本地状态, 真实商米对接由独立服务完成)
   */
  bind(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/speaker/bind', params: { id } });
  },

  /**
   * 解绑云音响设备
   */
  unbind(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/speaker/unbind', params: { id } });
  },
};

/** 云音响设备查询参数 */
export interface SpeakerDeviceQuery {
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
export interface SpeakerDeviceParam {
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
export interface SpeakerDeviceResult extends BaseEntity {
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
