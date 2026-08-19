import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 退款订单管理 API
 */
export const RefundOrderApi = {
  /**
   * 分页查询退款订单
   */
  page(params: RefundOrderQuery & { current?: number; size?: number }): Promise<Result<PageResult<RefundOrderResult>>> {
    return defHttp.get({ url: '/admin/order/refund/page', params });
  },

  /**
   * 根据ID查询退款订单详情
   */
  getById(id: string): Promise<Result<RefundOrderResult>> {
    return defHttp.get({ url: '/admin/order/refund/get-by-id', params: { id } });
  },

  /**
   * 发起退款
   */
  refund(data: RefundParam): Promise<Result<RefundOrderResult>> {
    return defHttp.post({ url: '/admin/order/refund/refund', data });
  },

  /**
   * 同步退款状态(主动向通道查询)
   */
  sync(id: string): Promise<Result<RefundOrderResult>> {
    return defHttp.post({ url: '/admin/order/refund/sync', params: { id } });
  },

  /**
   * 手动关闭异常退款单(仅PROGRESS且创建超7天)
   */
  manualClose(id: string): Promise<Result<RefundOrderResult>> {
    return defHttp.post({ url: '/admin/order/refund/manual-close', params: { id } });
  },
};

/** 退款订单查询参数 */
export interface RefundOrderQuery {
  mchNo?: string;
  appId?: string;
  refundNo?: string;
  bizRefundNo?: string;
  /** 原支付资金交易号 */
  tradeNo?: string;
  /** 交易类型 normal/gateway */
  tradeType?: string;
  bizOrderNo?: string;
  status?: string;
  /** 支付产品 */
  product?: string;
  storeNo?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
}

/** 退款发起参数 */
export interface RefundParam {
  /** 商户号(运营端代发必传, 订单定位与幂等查重按商户维度) */
  mchNo: string;
  /** 原支付资金交易号 */
  tradeNo?: string;
  bizOrderNo?: string;
  amount: number;
  reason?: string;
  bizRefundNo?: string;
}

/** 退款订单结果（管理端不暴露 capability） */
export interface RefundOrderResult extends MchEntity {
  refundNo?: string;
  bizRefundNo?: string;
  title?: string;
  tradeNo?: string;
  tradeType?: string;
  bizOrderNo?: string;
  outOrderNo?: string;
  outRefundNo?: string;
  relationOrderNo?: string;
  amount?: number;
  orderAmount?: number;
  currency?: string;
  reason?: string;
  status?: string;
  finishTime?: string;
  channel?: string;
  product?: string;
  channelMchNo?: string;
  channelAppId?: string;
  notifyUrl?: string;
  attach?: string;
  clientIp?: string;
  storeNo?: string;
  errorMsg?: string;
}
