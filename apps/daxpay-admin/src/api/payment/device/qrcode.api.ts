import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付码牌 API
 */
export const DeviceQrCodeApi = {
  /**
   * 分页查询码牌
   */
  page(
    params: DeviceQrCodeQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<DeviceQrCodeResult>>> {
    return defHttp.get({ url: '/admin/device/qrcode/page', params });
  },

  /**
   * 根据 id 查询码牌
   */
  get(id: string): Promise<Result<DeviceQrCodeResult>> {
    return defHttp.get({ url: '/admin/device/qrcode/get', params: { id } });
  },

  /**
   * 批量创建空白码牌
   */
  createBatch(data: DeviceQrCodeBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/qrcode/create-batch', data });
  },

  /**
   * 判断批次号是否已存在
   */
  existsByBatchNo(batchNo: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/admin/device/qrcode/exists-by-batch-no', params: { batchNo } });
  },

  /**
   * 批量绑定商户
   */
  bindMerchant(data: DeviceQrCodeBindMerchantParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/qrcode/bind-merchant', data });
  },

  /**
   * 批量解绑商户
   */
  unbindMerchant(ids: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/qrcode/unbind-merchant', data: ids });
  },

  /**
   * 修改码牌
   */
  update(data: DeviceQrCodeParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/qrcode/update', data });
  },

  /**
   * 删除码牌
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/qrcode/delete', params: { id } });
  },

  /**
   * 修改码牌状态(启用/停用)
   */
  changeStatus(id: string, status: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/qrcode/change-status', params: { id, status } });
  },

  /**
   * 获取码牌扫码链接(完整 H5 地址)
   */
  getCodeLink(code: string): Promise<Result<string>> {
    return defHttp.get({ url: '/admin/device/qrcode/get-code-link', params: { code } });
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
  /** 商户号 */
  mchNo?: string;
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
  /** 商户号(只读展示, 不提交归属变更) */
  mchNo?: string;
  /** 金额类型 random/fixed */
  amountType?: string;
  /** 固定金额(分) */
  fixedAmount?: number;
  /** 状态 */
  status?: string;
  /** 备注 */
  remark?: string;
}

/** 批量创建空白码牌参数 */
export interface DeviceQrCodeBatchParam {
  /** 批次号 */
  batchNo?: string;
  /** 创建数量 1-999 */
  count?: number;
  /** 码牌名称 */
  name?: string;
  /** 金额类型 random/fixed */
  amountType?: string;
  /** 固定金额(分) */
  fixedAmount?: number;
  /** 状态 enabled/disabled, 空则默认启用 */
  status?: string;
  /** 备注 */
  remark?: string;
}

/** 绑定商户参数 */
export interface DeviceQrCodeBindMerchantParam {
  /** 码牌主键列表 */
  ids: string[];
  /** 商户号 */
  mchNo: string;
  /** 关联应用号 */
  appId?: string;
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
  /** 关联应用号(空=商户默认应用) */
  appId?: string;
  /** 金额类型 random/fixed */
  amountType?: string;
  /** 固定金额(分) */
  fixedAmount?: number;
  /** 状态 enabled/disabled */
  status?: string;
  /** 备注 */
  remark?: string;
}
