import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 易支付订单API（商户端）
 */
export const EasyPayOrderApi = {
  /**
   * 分页查询易支付订单
   */
  page(
    params: EasyPayOrderQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<EasyPayOrderResult>>> {
    return defHttp.get({ url: '/mch/easypay/order/page', params });
  },

  /**
   * 根据ID查询易支付订单详情
   */
  getById(id: string): Promise<Result<EasyPayOrderResult>> {
    return defHttp.get({ url: '/mch/easypay/order/get-by-id', params: { id } });
  },

  /**
   * 同步易支付订单状态(主动向通道查询)
   */
  sync(id: string): Promise<Result<EasyPaySyncResult>> {
    return defHttp.post({ url: '/mch/easypay/order/sync', params: { id } });
  },

  /**
   * 关闭易支付订单
   */
  close(id: string): Promise<Result<void>> {
    return defHttp.post({
      url: '/mch/easypay/order/close',
      params: { id },
    });
  },
};

/** 易支付订单查询参数 */
export interface EasyPayOrderQuery {
  /** 商户号 */
  mchNo?: string;
  /** 应用号 */
  appId?: string;
  /** 商户订单号 */
  outTradeNo?: string;
  /** 平台业务单号 */
  tradeNo?: string;
  /** 商品名称 */
  name?: string;
  /** 协议支付方式 alipay/wxpay/aggregate */
  type?: string;
  /** 协议状态 0=待付 1=成功 */
  status?: number;
  /** 易支付商户号 */
  pid?: number;
  /** API版本 v1/v2 */
  apiVersion?: string;
  /** 创建时间-开始 */
  createTimeStart?: string;
  /** 创建时间-结束 */
  createTimeEnd?: string;
}

/** 易支付订单结果 */
export interface EasyPayOrderResult extends MchEntity {
  /** 关联内核容器ID */
  orderId?: string;
  /** 易支付商户号 */
  pid?: number;
  /** 平台业务单号(对外 trade_no) */
  tradeNo?: string;
  /** 商户订单号 */
  outTradeNo?: string;
  /** 通道订单号 */
  apiTradeNo?: string;
  /** 协议支付方式 alipay/wxpay/aggregate */
  type?: string;
  /** 协议状态 0=待付 1=成功 */
  status?: number;
  /** 创建时间 */
  addTime?: string;
  /** 完成时间 */
  endTime?: string;
  /** 商品名称 */
  name?: string;
  /** 金额(元) */
  money?: number;
  /** 已退款金额(元) */
  refundMoney?: number;
  /** 异步通知地址 */
  notifyUrl?: string;
  /** 同步跳转地址 */
  returnUrl?: string;
  /** 业务扩展参数 */
  param?: string;
  /** 支付用户标识 */
  buyer?: string;
  /** 客户端IP */
  clientIp?: string;
  /** API版本 v1/v2 */
  apiVersion?: string;
  /** PC调用方式 */
  pcCallType?: string;
  /** 支付链接 */
  payUrl?: string;
  /** 支付参数体 */
  payBody?: string;
}

/** 易支付订单同步结果 */
export interface EasyPaySyncResult {
  /** 同步后的订单状态 */
  orderStatus?: string;
  /** 是否发生了状态调整 */
  adjust?: boolean;
}
