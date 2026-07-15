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
  refund(data: PayRefundParam): Promise<Result<RefundOrderResult>> {
    return defHttp.post({ url: '/admin/order/refund/refund', data });
  },

  /**
   * 同步退款状态(主动向通道查询)
   */
  sync(id: string): Promise<Result<RefundOrderResult>> {
    return defHttp.post({ url: '/admin/order/refund/sync', params: { id } });
  },
};

/** 退款订单查询参数 */
export interface RefundOrderQuery {
  /** 商户号 */
  mchNo?: string;
  /** 应用号 */
  appId?: string;
  /** 退款号 */
  refundNo?: string;
  /** 商户退款号 */
  bizRefundNo?: string;
  /** 原支付订单号 */
  orderNo?: string;
  /** 商户业务订单号 */
  bizOrderNo?: string;
  /** 退款状态 */
  status?: string;
  /** 支付通道 */
  channel?: string;
  /** 门店号 */
  storeNo?: string;
  /** 创建时间-开始 */
  createTimeStart?: string;
  /** 创建时间-结束 */
  createTimeEnd?: string;
}

/** 退款发起参数 */
export interface PayRefundParam {
  /** 原支付订单号 */
  orderNo?: string;
  /** 商户业务订单号 */
  bizOrderNo?: string;
  /** 退款金额(分) */
  amount: number;
  /** 退款原因 */
  reason?: string;
  /** 商户退款号(可选) */
  bizRefundNo?: string;
}

/** 退款订单结果 */
export interface RefundOrderResult extends MchEntity {
  /** 退款号 */
  refundNo?: string;
  /** 商户退款号 */
  bizRefundNo?: string;
  /** 标题 */
  title?: string;
  /** 原支付订单号 */
  orderNo?: string;
  /** 商户业务订单号 */
  bizOrderNo?: string;
  /** 通道支付订单号 */
  outOrderNo?: string;
  /** 通道退款流水号 */
  outRefundNo?: string;
  /** 退款金额(分) */
  amount?: number;
  /** 订单总金额(分) */
  orderAmount?: number;
  /** 退款原因 */
  reason?: string;
  /** 退款状态 */
  status?: string;
  /** 退款完成时间 */
  finishTime?: string;
  /** 支付通道 */
  channel?: string;
  /** 支付产品 */
  product?: string;
  /** 支付方式 */
  method?: string;
  /** 门店号 */
  storeNo?: string;
  /** 错误信息 */
  errorMsg?: string;
}
