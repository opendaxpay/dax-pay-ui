import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付码牌 API（商户端 /mch/device/qrcode/*）
 *
 * mchNo 由后端 PaymentContext 强制隔离；不提供批量生成、商户归属变更与删除（运营端能力）
 */
export const DeviceQrCodeApi = {
  /**
   * 分页查询码牌(仅当前商户)
   */
  page(
    params: DeviceQrCodeQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<DeviceQrCodeResult>>> {
    return defHttp.get({ url: '/mch/device/qrcode/page', params });
  },

  /**
   * 根据 id 查询码牌
   */
  get(id: string): Promise<Result<DeviceQrCodeResult>> {
    return defHttp.get({ url: '/mch/device/qrcode/get', params: { id } });
  },

  /**
   * 修改码牌(业务配置; 编码与归属不可改)
   */
  update(data: DeviceQrCodeParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/qrcode/update', data });
  },

  /**
   * 修改码牌状态(启用/停用)
   */
  changeStatus(id: string, status: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/qrcode/change-status', params: { id, status } });
  },

  /**
   * 批量绑定应用(须归属当前商户)
   */
  bindApp(data: DeviceQrCodeBindAppParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/qrcode/bind-app', data });
  },

  /**
   * 批量解绑应用(仅清 appId, 支付时走默认应用)
   */
  unbindApp(ids: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/qrcode/unbind-app', data: ids });
  },

  /**
   * 批量绑定门店(须归属当前商户)
   */
  bindStore(data: DeviceQrCodeBindStoreParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/qrcode/bind-store', data });
  },

  /**
   * 批量解绑门店(保留商户/应用)
   */
  unbindStore(ids: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/qrcode/unbind-store', data: ids });
  },

  /**
   * 认领空白码牌(按编码将平台空白库存码认领到当前商户)
   */
  claim(data: DeviceQrCodeClaimParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/qrcode/claim', data });
  },

  /**
   * 获取码牌扫码链接(完整地址, 按 programType 分流 /h 或 /m)
   */
  getCodeLink(code: string): Promise<Result<string>> {
    return defHttp.get({ url: '/mch/device/qrcode/get-code-link', params: { code } });
  },

  /**
   * 分账能力预警(码牌开启分账前预检, 不阻断; 返回不支持分账的扫码场景清单)
   */
  allocCapabilityWarning(appId?: string): Promise<Result<DeviceQrCodeAllocWarningResult[]>> {
    return defHttp.get({ url: '/mch/device/qrcode/alloc-capability-warning', params: { appId } });
  },
};

/** 支付码牌查询参数 */
export interface DeviceQrCodeQuery {
  /** 码牌编码 */
  code?: string;
  /** 码牌名称 */
  name?: string;
  /** 批次号 */
  batchNo?: string;
  /** 绑定门店号 */
  storeNo?: string;
  /** 落地程序类型 h5/mini_app */
  programType?: string;
  /** 金额类型 random/fixed */
  amountType?: string;
  /** 状态 enabled/disabled */
  status?: string;
}

/** 支付码牌参数(编辑) */
export interface DeviceQrCodeParam {
  /** 主键 */
  id?: string;
  /** 码牌名称 */
  name?: string;
  /** 金额类型 random/fixed */
  amountType?: string;
  /** 固定金额(分) */
  fixedAmount?: number;
  /** 是否分账码牌(产品不支持分账时扫码支付自动降级普通收款) */
  allocation?: boolean;
  /** 备注 */
  remark?: string;
}

/** 绑定应用参数 */
export interface DeviceQrCodeBindAppParam {
  /** 码牌主键列表 */
  ids: string[];
  /** 应用 */
  appId: string;
}

/** 绑定门店参数 */
export interface DeviceQrCodeBindStoreParam {
  /** 码牌主键列表 */
  ids: string[];
  /** 门店号 */
  storeNo: string;
}

/** 认领空白码牌参数 */
export interface DeviceQrCodeClaimParam {
  /** 码牌编码 */
  code: string;
}

/** 支付码牌结果 */
export interface DeviceQrCodeResult extends BaseEntity {
  /** 码牌编码 */
  code?: string;
  /** 码牌名称 */
  name?: string;
  /** 批次号 */
  batchNo?: string;
  /** 商户号 */
  mchNo?: string;
  /** 商户名称(由 mchNo 翻译) */
  mchName?: string;
  /** 应用(空=商户默认应用) */
  appId?: string;
  /** 应用名称(由 appId 翻译) */
  appName?: string;
  /** 绑定门店号 */
  storeNo?: string;
  /** 门店名称(由 storeNo 翻译) */
  storeName?: string;
  /** 落地程序类型 h5/mini_app */
  programType?: string;
  /** 金额类型 random/fixed */
  amountType?: string;
  /** 固定金额(分) */
  fixedAmount?: number;
  /** 状态 enabled/disabled */
  status?: string;
  /** 是否分账码牌(产品不支持分账时扫码支付自动降级普通收款) */
  allocation?: boolean;
  /** 备注 */
  remark?: string;
}

/** 码牌分账能力预警项(不支持分账的扫码场景) */
export interface DeviceQrCodeAllocWarningResult {
  /** 客户端环境(wechat/alipay/union_pay/douyin) */
  clientEnv?: string;
  /** 支付形态(h5/mini) */
  payForm?: string;
  /** 路由解析出的支付产品编码 */
  product?: string;
  /** 产品所属通道 */
  channel?: string;
}
