import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 资金交易凭证API（商户端）
 */
export const PayTradeApi = {
  /**
   * 分页查询资金交易
   */
  page(params: PayTradeQuery & { current?: number; size?: number }): Promise<Result<PageResult<PayTradeResult>>> {
    return defHttp.get({ url: '/mch/order/pay-trade/page', params });
  },

  /**
   * 根据ID查询资金交易详情
   */
  getById(id: string): Promise<Result<PayTradeResult>> {
    return defHttp.get({ url: '/mch/order/pay-trade/get-by-id', params: { id } });
  },

  /**
   * 同步支付状态(主动向通道查询)
   */
  sync(id: string): Promise<Result<NormalPaySyncResult>> {
    return defHttp.post({ url: '/mch/order/pay-trade/sync', params: { id } });
  },

  /**
   * 关闭/撤销订单
   * @param useCancel 是否使用撤销
   */
  close(id: string, useCancel = false): Promise<Result<void>> {
    return defHttp.post({
      url: '/mch/order/pay-trade/close',
      params: { id, useCancel },
    });
  },
};

/** 资金交易查询参数 */
export interface PayTradeQuery {
  /** 商户号 */
  mchNo?: string;
  /** 应用号 */
  appId?: string;
  /** 支付交易号 */
  tradeNo?: string;
  /** 通道订单号 */
  outOrderNo?: string;
  /** 资金状态 */
  status?: string;
  /** 交易形态 */
  tradeType?: string;
  // pay_trade 无 channel/method/product 列，不可筛选
  /** 通道商户号 */
  channelMchNo?: string;
  /** 门店号 */
  storeNo?: string;
  /** 关联容器ID */
  containerId?: string;
  /** 创建时间-开始 */
  createTimeStart?: string;
  /** 创建时间-结束 */
  createTimeEnd?: string;
  /** 金额下限(分) */
  amountMin?: number;
  /** 金额上限(分) */
  amountMax?: number;
}

/** 资金交易结果(含详情联表字段) */
export interface PayTradeResult extends MchEntity {
  /** 支付交易号 */
  tradeNo?: string;
  /** 交易形态 */
  tradeType?: string;
  /** 关联容器ID */
  containerId?: string;
  /** 支付产品 */
  product?: string;
  /** 支付通道 */
  channel?: string;
  /** 支付方式 */
  method?: string;
  /** 限制支付类型 */
  limitPay?: string;
  /** 支付渠道 */
  provider?: string;
  /** 本次交易金额(分) */
  amount?: number;
  /** 币种 */
  currency?: string;
  /** 入账金额(分); 结算类成功=amount, 预授权冻结等=0 */
  postedAmount?: number;
  /** 可退金额(分) */
  refundableBalance?: number;
  /** 资金状态 */
  status?: string;
  /** 过期时间 */
  expiredTime?: string;
  /** 支付成功时间 */
  payTime?: string;
  /** 关闭时间 */
  closeTime?: string;
  /** 订单来源 */
  source?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 门店号 */
  storeNo?: string;
  /** 通道订单号 */
  outOrderNo?: string;
  /** 透传订单号 */
  transOrderNo?: string;
  /** 特殊通道关联订单号 */
  relationOrderNo?: string;
  /** 付款用户ID */
  buyerId?: string;
  /** 微信openid */
  openid?: string;
  /** 通道方记录的支付产品 */
  tradeProduct?: string;
  /** 通道方记录的交易方式 */
  tradeWay?: string;
  /** 银行卡类型 */
  bankType?: string;
  /** 付款码 */
  authCode?: string;
  /** 活动类型 */
  promotionType?: string;
  /** 支付参数体 */
  payBody?: string;
  /** 支付参数体类型 */
  payBodyType?: string;
  /** 错误信息 */
  errorMsg?: string;
  // ===== 容器联表字段(详情) =====
  /** 容器平台业务单号 */
  containerOrderNo?: string;
  /** 商户业务单号 */
  bizOrderNo?: string;
  /** 订单标题 */
  title?: string;
  /** 容器业务状态 */
  containerStatus?: string;
}

/** 支付同步结果 */
export interface NormalPaySyncResult {
  /** 同步后的资金状态 */
  orderStatus?: string;
  /** 是否发生了状态调整 */
  adjust?: boolean;
}
