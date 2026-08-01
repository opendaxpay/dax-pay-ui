import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 普通支付业务订单API（商户端）
 */
export const NormalOrderApi = {
  /**
   * 分页查询业务订单
   */
  page(params: NormalOrderQuery & { current?: number; size?: number }): Promise<Result<PageResult<NormalOrderResult>>> {
    return defHttp.get({ url: '/mch/order/normal-pay/page', params });
  },

  /**
   * 根据ID查询业务订单详情
   */
  getById(id: string): Promise<Result<NormalOrderResult>> {
    return defHttp.get({ url: '/mch/order/normal-pay/get-by-id', params: { id } });
  },

  /**
   * 同步支付状态(主动向通道查询)
   */
  sync(id: string): Promise<Result<NormalPaySyncResult>> {
    return defHttp.post({ url: '/mch/order/normal-pay/sync', params: { id } });
  },
};

/** 业务订单查询参数 */
export interface NormalOrderQuery {
  /** 商户号 */
  mchNo?: string;
  /** 应用号 */
  appId?: string;
  /** 平台业务单号 */
  orderNo?: string;
  /** 商户业务单号 */
  bizOrderNo?: string;
  /** 订单标题 */
  title?: string;
  /** 业务状态 */
  status?: string;
  /** 支付产品 */
  product?: string;
  /** 支付能力 */
  capability?: string;
  /** 门店号 */
  storeNo?: string;
  /** 创建时间-开始 */
  createTimeStart?: string;
  /** 创建时间-结束 */
  createTimeEnd?: string;
  /** 金额下限(分) */
  amountMin?: number;
  /** 金额上限(分) */
  amountMax?: number;
}

/** 业务订单结果(含详情联表字段) */
export interface NormalOrderResult extends MchEntity {
  /** 平台业务单号 */
  orderNo?: string;
  /** 商户业务单号 */
  bizOrderNo?: string;
  /** 订单来源 */
  source?: string;
  /** 标题 */
  title?: string;
  /** 描述 */
  description?: string;
  /** 业务状态 */
  status?: string;
  /** 异步通知地址 */
  notifyUrl?: string;
  /** 同步跳转地址 */
  returnUrl?: string;
  /** 商户附加参数 */
  attach?: string;
  /** 业务单过期时间 */
  expiredTime?: string;
  /** 业务单金额(分) */
  amount?: number;
  /** 币种 */
  currency?: string;
  /** 支付通道 */
  channel?: string;
  /** 支付方式 */
  method?: string;
  /** 支付产品 */
  product?: string;
  /** 支付能力 */
  capability?: string;
  /** 支付成功时间 */
  payTime?: string;
  /** 关闭时间 */
  closeTime?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 通道应用 AppId */
  channelAppId?: string;
  /** 客户端IP */
  clientIp?: string;
  /** 终端设备编码 */
  terminalNo?: string;
  /** 门店号 */
  storeNo?: string;
  // ===== 资金凭证联表字段(详情) =====
  /** 资金交易号 */
  tradeNo?: string;
  /** 通道订单号 */
  outOrderNo?: string;
  /** 资金状态 */
  fundStatus?: string;
  /** 可退金额(分) */
  refundableBalance?: number;
  /** 支付参数体 */
  payBody?: string;
  /** 支付参数体类型 */
  payBodyType?: string;
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
  /** 错误信息 */
  errorMsg?: string;
}

/** 支付同步结果 */
export interface NormalPaySyncResult {
  /** 同步后的资金状态 */
  orderStatus?: string;
  /** 是否发生了状态调整 */
  adjust?: boolean;
}
