import type { DeviceTestParam } from '@daxpay/ui-biz/components/device-test';

import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 虚拟设备 API(简版: 生成/归属/编辑/启停/删除/激活二维码/试播试打)
 *
 * 虚拟设备 = 手机 APP 变云音箱/云打印(收款语音播报 + 小票打印);
 * 简版裁剪: 无代理商分拨/收回、无 CSV 导出、无监控、无激活日志、无模板列表接口。
 */
export const VirtualDeviceApi = {
  /**
   * 分页查询虚拟设备
   */
  page(
    params: VirtualDeviceQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<VirtualDeviceResult>>> {
    return defHttp.get({ url: '/admin/device/virtual/page', params });
  },

  /**
   * 生成虚拟设备(产号+入库原子完成, 返回设备号清单)
   */
  generate(data: VirtualDeviceGenerateParam): Promise<Result<string[]>> {
    return defHttp.post({ url: '/admin/device/virtual/generate', data });
  },

  /**
   * 修改虚拟设备(仅名称/启停, 设备号与归属不可改)
   */
  update(data: VirtualDeviceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/virtual/update', data });
  },

  /**
   * 启用/停用虚拟设备(列表开关直切)
   */
  changeEnable(id: string, enable: boolean): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/virtual/change-enable', params: { id, enable } });
  },

  /**
   * 删除虚拟设备(未激活未绑定才可删, 后端守卫)
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/virtual/delete', params: { id } });
  },

  /**
   * 批量绑定商户(可选关联应用与门店)
   */
  bindMerchant(data: VirtualBindMerchantParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/virtual/bind-merchant', data });
  },

  /**
   * 批量解绑商户(凭证重置, 设备端需重新激活)
   */
  unbindMerchant(ids: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/virtual/unbind-merchant', data: ids });
  },

  /**
   * 试播文案预览(平台镜像终端词元规则, 返回预计播报文本; 运营端为纯预览, 不下发设备)
   */
  testSpeech(params: { amountFen?: number; channel?: string }): Promise<Result<string>> {
    return defHttp.get({ url: '/admin/device/virtual/test-speech', params });
  },

  /**
   * 试打(带 templateCode, 返回 msgId 供回执比对)
   */
  testPrint(data: DeviceTestParam): Promise<Result<string>> {
    return defHttp.post({ url: '/admin/device/virtual/test-print', data });
  },

  /**
   * 激活二维码内容(扫码协议 daxpay:activate:{baseUrl}:{sn}, 前端只渲染)
   */
  qrContent(deviceNo: string): Promise<Result<string>> {
    return defHttp.get({ url: '/admin/device/virtual/qr-content', params: { deviceNo } });
  },
};

/** 虚拟设备查询参数 */
export interface VirtualDeviceQuery {
  /** 设备名称 */
  name?: string;
  /** 设备号 */
  deviceNo?: string;
  /** 批次号 */
  batchNo?: string;
  /** 商户号 */
  mchNo?: string;
  /** 关联应用号(空=全部应用) */
  appId?: string;
  /** 使用门店号(门店工作台跳转预置筛选用) */
  storeNo?: string;
  /** 是否启用 */
  enable?: boolean;
}

/** 虚拟设备生成参数(产号+入库原子完成) */
export interface VirtualDeviceGenerateParam {
  /** 批次号 */
  batchNo?: string;
  /** 生成数量(1~5000) */
  count?: number;
}

/** 虚拟设备编辑参数(运营端只维护台账名称/启停) */
export interface VirtualDeviceParam {
  /** 主键 */
  id?: string;
  /** 设备名称 */
  name?: string;
  /** 是否启用 */
  enable?: boolean;
}

/** 虚拟设备绑定商户参数 */
export interface VirtualBindMerchantParam {
  /** 设备主键列表 */
  ids: string[];
  /** 商户号 */
  mchNo?: string;
  /** 关联应用号(可空=商户默认应用) */
  appId?: string;
  /** 绑定门店号(可空=商户通用设备) */
  storeNo?: string;
}

/** 虚拟设备结果 */
export interface VirtualDeviceResult extends BaseEntity {
  /** 设备名称 */
  name?: string;
  /** 设备号(平台自造 SN, VD+日期+随机段) */
  deviceNo?: string;
  /** 批次号 */
  batchNo?: string;
  /** 关联应用号 */
  appId?: string;
  /** 应用名称(由 appId 翻译, 空=全部应用) */
  appName?: string;
  /** 使用门店号(空=未分配) */
  storeNo?: string;
  /** 门店名称(由 storeNo 翻译, 未分配为空) */
  storeName?: string;
  /** 是否启用 */
  enable?: boolean;
  /** 是否已激活(secret 非空) */
  activated?: boolean;
  /** 是否在线(心跳窗口内) */
  online?: boolean;
  /** 最后在线时间 */
  lastOnlineTime?: string;
  /** 所属商户号 */
  mchNo?: string;
  /** 商户名称(由 mchNo 翻译) */
  mchName?: string;
}
