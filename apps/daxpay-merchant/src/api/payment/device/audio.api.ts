import type { DeviceTestParam } from '@daxpay/ui-biz/components/device-test';

import type { BaseEntity, PageResult, Result } from '#/types/web';

import { downloadExportFile } from '@daxpay/ui-biz/utils/export-download';

import { defHttp, requestClient } from '#/api/request';

/**
 * 收款设备(虚拟设备) API（商户端 /mch/device/audio/*）
 *
 * 当前仅虚拟设备（vendor=virtual，手机 APP 变云音箱/云打印）；商户号由后端登录态强制隔离。
 * 商户自助能力：查看 / 应用与门店调整 / 启停 / 激活二维码 / 试播试打;
 * 设备由运营端生成并绑定商户, 商户在 APP 端扫激活二维码(或手填设备号)激活。
 */
export const AudioDeviceApi = {
  /**
   * 分页查询收款设备(仅当前商户)
   */
  page(params: AudioDeviceQuery & { current?: number; size?: number }): Promise<Result<PageResult<AudioDeviceResult>>> {
    return defHttp.get({ url: '/mch/device/audio/page', params });
  },

  /**
   * 根据 id 查询收款设备
   */
  get(id: string): Promise<Result<AudioDeviceResult>> {
    return defHttp.get({ url: '/mch/device/audio/get', params: { id } });
  },

  /**
   * 修改设备名称(启停走 changeEnable, 不在此接口)
   */
  update(data: AudioDeviceUpdateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/audio/update', data });
  },

  /**
   * 导出当前查询条件下的收款设备清单
   *
   * 服务端生成 xlsx, 失败文案由 downloadExportFile 统一提示。
   */
  exportExcel(query: AudioDeviceQuery, options: { failedText: string; fileName: string }): Promise<boolean> {
    return downloadExportFile({
      client: requestClient,
      url: '/mch/device/audio/export',
      params: { ...query },
      fileName: options.fileName,
      failedText: options.failedText,
    });
  },

  /**
   * 调整使用应用(空=全部应用)
   */
  bindApp(data: AudioDeviceBindAppParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/audio/bind-app', data });
  },

  /**
   * 调整使用门店
   */
  bindStore(data: AudioDeviceBindStoreParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/audio/bind-store', data });
  },

  /**
   * 解绑门店(置为未分配, 不参与播报/打印)
   */
  unbindStore(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/audio/unbind-store', params: { id } });
  },

  /**
   * 批量调整使用应用(空=全部应用)
   */
  bindAppBatch(data: AudioDeviceBindAppBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/audio/bind-app-batch', data });
  },

  /**
   * 批量调整使用门店(空=解绑门店/未分配)
   */
  bindStoreBatch(data: AudioDeviceBindStoreBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/audio/bind-store-batch', data });
  },

  /**
   * 启用/停用设备
   */
  changeEnable(id: string, enable: boolean): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/audio/change-enable', params: { id, enable } });
  },

  /**
   * 试播(可指定金额与收款方式, 返回 msgId 供回执比对)
   */
  testBroadcast(data: DeviceTestParam): Promise<Result<string>> {
    return defHttp.post({ url: '/mch/device/audio/test-broadcast', data });
  },

  /**
   * 试播文案预览(返回预计播报文本)
   */
  testSpeech(params: { amountFen?: number; channel?: string }): Promise<Result<string>> {
    return defHttp.get({ url: '/mch/device/audio/test-speech', params });
  },

  /**
   * 试打(内置版式渲染, 参数携带 templateCode; 返回 msgId 供回执比对)
   */
  testPrint(data: DeviceTestParam): Promise<Result<string>> {
    return defHttp.post({ url: '/mch/device/audio/test-print', data });
  },

  /**
   * 激活二维码内容(返回内容字符串, 前端自行渲染二维码)
   */
  qrContent(deviceNo: string): Promise<Result<string>> {
    return defHttp.get({ url: '/mch/device/audio/qr-content', params: { deviceNo } });
  },
};

/** 收款设备查询参数 */
export interface AudioDeviceQuery {
  /** 设备号(模糊) */
  deviceNo?: string;
  /** 关联应用号(空=全部应用) */
  appId?: string;
  /** 使用门店号(空=未分配) */
  storeNo?: string;
  /** 是否启用 */
  enable?: boolean;
}

/** 调整使用应用参数 */
export interface AudioDeviceBindAppParam {
  /** 设备主键 */
  id: string;
  /** 应用号(空=全部应用) */
  appId?: string;
}

/** 批量调整使用应用参数 */
export interface AudioDeviceBindAppBatchParam {
  /** 设备主键列表 */
  ids: string[];
  /** 应用号(空=全部应用) */
  appId?: string;
}

/** 批量调整使用门店参数 */
export interface AudioDeviceBindStoreBatchParam {
  /** 设备主键列表 */
  ids: string[];
  /** 门店号(空=解绑门店/未分配) */
  storeNo?: string;
}

/** 修改设备名称参数 */
export interface AudioDeviceUpdateParam {
  /** 设备主键 */
  id: string;
  /** 设备名称 */
  name: string;
}

/** 调整使用门店参数 */
export interface AudioDeviceBindStoreParam {
  /** 设备主键 */
  id: string;
  /** 门店号(须归属当前商户) */
  storeNo: string;
}

/** 收款设备结果 */
export interface AudioDeviceResult extends BaseEntity {
  /** 设备名称 */
  name?: string;
  /** 设备号 */
  deviceNo?: string;
  /** 设备厂商(virtual=虚拟设备, 当前仅此一种) */
  vendor?: string;
  /** 关联应用号(空=全部应用) */
  appId?: string;
  /** 应用名称(空=全部应用) */
  appName?: string;
  /** 使用门店号(空=未分配) */
  storeNo?: string;
  /** 使用门店名称(空=未分配) */
  storeName?: string;
  /** 是否启用 */
  enable?: boolean;
  /** 是否已激活(secret 非空, 仅虚拟设备有值) */
  activated?: boolean;
  /** 是否在线(心跳 15 分钟窗口, 仅虚拟设备有值) */
  online?: boolean;
  /** 最后在线时间(心跳节流落库, 非实时, 仅虚拟设备有值) */
  lastOnlineTime?: string;
  /** 商户号 */
  mchNo?: string;
  /** 商户名称 */
  mchName?: string;
}
