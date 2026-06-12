import type { PayProductResult } from '#/api/payment/masterdata/product.api';
import type { BaseEntity, LabelValue, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/** 支付通道系统常量 API（只读） */
export const PayChannelApi = {
  /** 分页查询 */
  page(params: PayChannelPageParam): Promise<Result<PageResult<PayChannelItem>>> {
    return defHttp.get({ url: '/admin/payment/pay-channel/page', params });
  },
  /** 根据编码查询详情 */
  findByCode(code: string): Promise<Result<PayChannelItem>> {
    return defHttp.get({ url: '/admin/payment/pay-channel/get', params: { code } });
  },
  /** 按通道编码查询支付产品 */
  listProductsByChannel(channel: string): Promise<Result<PayProductResult[]>> {
    return defHttp.get({ url: '/admin/payment/pay-channel/list-products', params: { channel } });
  },
  /** 通道下拉列表 */
  dropdown(): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/admin/payment/pay-channel/dropdown' });
  },
};

/** 支付通道分页查询参数 */
export interface PayChannelPageParam {
  current?: number;
  size?: number;
  code?: string;
  name?: string;
}

/** 支付通道项 */
export interface PayChannelItem extends BaseEntity {
  /** 通道编码 */
  code?: string;
  /** 通道名称 */
  name?: string;
  /** 排序号 */
  sortNo?: number;
  /** 通道介绍 */
  description?: string;
  /** 图标 */
  icon?: string;
}
