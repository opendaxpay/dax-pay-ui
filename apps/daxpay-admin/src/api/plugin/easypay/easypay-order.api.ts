import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 易支付订单管理 API(扩展插件)
 */
export const EasyPayOrderApi = {
  /**
   * 分页查询易支付订单
   */
  page(
    params: EasyPayOrderQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<EasyPayOrderResult>>> {
    return defHttp.get({ url: '/admin/easypay/order/page', params });
  },

  /**
   * 根据ID查询易支付订单详情
   */
  getById(id: string): Promise<Result<EasyPayOrderResult>> {
    return defHttp.get({ url: '/admin/easypay/order/get-by-id', params: { id } });
  },

  /**
   * 同步易支付订单状态(主动向通道查询)
   */
  sync(id: string): Promise<Result<EasyPaySyncResult>> {
    return defHttp.post({ url: '/admin/easypay/order/sync', params: { id } });
  },

  /**
   * 关闭订单
   */
  close(id: string): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/easypay/order/close',
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
  /** 支付方式 */
  type?: string;
  /** 协议状态(0=待付 1=成功) */
  status?: number;
  /** 易支付商户ID */
  pid?: number;
  /** 协议版本 */
  apiVersion?: string;
  /** 创建时间-开始 */
  createTimeStart?: string;
  /** 创建时间-结束 */
  createTimeEnd?: string;
}

/** 易支付订单结果(金额单位为元, 直接展示) */
export interface EasyPayOrderResult extends MchEntity {
  /** 易支付订单ID */
  orderId?: string;
  /** 易支付商户ID */
  pid?: number;
  /** 应用号 */
  appId?: string;
  /** 平台业务单号 */
  tradeNo?: string;
  /** 商户订单号 */
  outTradeNo?: string;
  /** 通道交易号 */
  apiTradeNo?: string;
  /** 支付方式 */
  type?: string;
  /** 协议状态(0=待付 1=成功) */
  status?: number;
  /** 下单时间 */
  addTime?: string;
  /** 完成时间 */
  endTime?: string;
  /** 商品名称 */
  name?: string;
  /** 订单金额(元) */
  money?: number;
  /** 已退款金额(元) */
  refundMoney?: number;
  /** 异步通知地址 */
  notifyUrl?: string;
  /** 同步跳转地址 */
  returnUrl?: string;
  /** 商户附加参数 */
  param?: string;
  /** 付款用户 */
  buyer?: string;
  /** 客户端IP */
  clientIp?: string;
  /** 协议版本 */
  apiVersion?: string;
  /** PC调用类型 */
  pcCallType?: string;
  /** 支付链接 */
  payUrl?: string;
  /** 支付参数体 */
  payBody?: string;
}

/** 易支付同步结果 */
export interface EasyPaySyncResult {
  /** 同步后的订单状态 */
  orderStatus?: string;
  /** 是否发生了状态调整 */
  adjust?: boolean;
}
