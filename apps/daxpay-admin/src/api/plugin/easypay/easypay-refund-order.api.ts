import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 易支付退款订单管理 API(扩展插件)
 */
export const EasyPayRefundOrderApi = {
  /**
   * 分页查询易支付退款订单
   */
  page(
    params: EasyPayRefundOrderQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<EasyPayRefundOrderResult>>> {
    return defHttp.get({ url: '/admin/easypay/refund/page', params });
  },

  /**
   * 根据ID查询易支付退款订单详情
   */
  getById(id: string): Promise<Result<EasyPayRefundOrderResult>> {
    return defHttp.get({ url: '/admin/easypay/refund/get-by-id', params: { id } });
  },

  /**
   * 同步易支付退款状态(主动向通道查询)
   */
  sync(id: string): Promise<Result<EasyPayRefundOrderResult>> {
    return defHttp.post({ url: '/admin/easypay/refund/sync', params: { id } });
  },
};

/** 易支付退款订单查询参数 */
export interface EasyPayRefundOrderQuery {
  /** 商户号 */
  mchNo?: string;
  /** 应用号 */
  appId?: string;
  /** 平台退款单号 */
  refundNo?: string;
  /** 商户退款单号 */
  bizRefundNo?: string;
  /** 商户订单号 */
  outTradeNo?: string;
  /** 平台业务单号 */
  tradeNo?: string;
  /** 易支付商户ID */
  pid?: number;
  /** 退款状态(0=失败/处理中 1=成功) */
  status?: number;
  /** 协议版本 */
  apiVersion?: string;
  /** 创建时间-开始 */
  createTimeStart?: string;
  /** 创建时间-结束 */
  createTimeEnd?: string;
}

/** 易支付退款订单结果(金额单位为元, 直接展示) */
export interface EasyPayRefundOrderResult extends MchEntity {
  /** 易支付退款单号 */
  refundId?: string;
  /** 关联易支付订单ID */
  easyPayOrderId?: string;
  /** 易支付商户ID */
  pid?: number;
  /** 应用号 */
  appId?: string;
  /** 平台退款单号 */
  refundNo?: string;
  /** 商户退款单号 */
  bizRefundNo?: string;
  /** 平台业务单号 */
  tradeNo?: string;
  /** 商户订单号 */
  outTradeNo?: string;
  /** 退款金额(元) */
  money?: number;
  /** 退款状态(0=失败/处理中 1=成功) */
  status?: number;
  /** 协议版本 */
  apiVersion?: string;
  /** 下单时间 */
  addTime?: string;
  /** 完成时间 */
  endTime?: string;
}
