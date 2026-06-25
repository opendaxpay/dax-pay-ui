import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 设备厂商配置 API
 */
export const DeviceVendorConfigApi = {
  /**
   * 分页查询厂商配置
   */
  page(
    params: DeviceVendorConfigQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<DeviceVendorConfigResult>>> {
    return defHttp.get({ url: '/admin/device/vendor-config/page', params });
  },

  /**
   * 根据 id 查询厂商配置
   */
  get(id: string): Promise<Result<DeviceVendorConfigResult>> {
    return defHttp.get({ url: '/admin/device/vendor-config/get', params: { id } });
  },

  /**
   * 新增厂商配置
   */
  add(data: DeviceVendorConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/vendor-config/add', data });
  },

  /**
   * 修改厂商配置
   */
  update(data: DeviceVendorConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/vendor-config/update', data });
  },

  /**
   * 删除厂商配置
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/vendor-config/delete', params: { id } });
  },

  /**
   * 查询指定设备类型和厂商的启用配置列表(设备下拉用)
   */
  listEnabledByVendor(
    deviceType: string,
    vendorCode: string,
  ): Promise<Result<DeviceVendorConfigResult[]>> {
    return defHttp.get({
      url: '/admin/device/vendor-config/list-enabled-by-vendor',
      params: { deviceType, vendorCode },
    });
  },
};

/** 厂商配置查询参数 */
export interface DeviceVendorConfigQuery {
  /** 设备类型(顶层厂商配置页可不传, 按厂商聚合查询) */
  deviceType?: string;
  /** 厂商代码 */
  vendorCode?: string;
  /** 配置名称 */
  configName?: string;
  /** 是否启用 */
  enable?: boolean;
}

/** 厂商配置参数 */
export interface DeviceVendorConfigParam {
  /** 主键 */
  id?: string;
  /** 设备类型 */
  deviceType?: string;
  /** 厂商代码 */
  vendorCode?: string;
  /** 配置名称 */
  configName?: string;
  /** 厂商应用ID */
  appId?: string;
  /** 厂商应用密钥 */
  appSecret?: string;
  /** 是否启用 */
  enable?: boolean;
  /** 扩展参数(JSON) */
  extParam?: string;
  /** 备注 */
  remark?: string;
}

/** 厂商配置结果 */
export interface DeviceVendorConfigResult extends BaseEntity {
  /** 设备类型 */
  deviceType?: string;
  /** 厂商代码 */
  vendorCode?: string;
  /** 配置名称 */
  configName?: string;
  /** 厂商应用ID */
  appId?: string;
  /** 厂商应用密钥(脱敏) */
  appSecret?: string;
  /** 是否启用 */
  enable?: boolean;
  /** 扩展参数(JSON) */
  extParam?: string;
  /** 备注 */
  remark?: string;
}
