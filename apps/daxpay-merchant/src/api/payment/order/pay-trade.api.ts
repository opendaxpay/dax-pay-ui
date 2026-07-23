import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 资金交易凭证 API（商户端）
 *
 * 对接 /mch/order/pay-trade/*，数据由后端按当前商户隔离。
 */
export const PayTradeApi = {
  /**
   * 分页查询资金交易
   */
  page(params: PayTradeQuery & { current?: number; size?: number }): Promise<Result<PageResult<PayTradeResult>>> {
    return defHttp.get({ url: '/mch/order/pay-trade/page', params });
  },
};

/** 资金交易查询参数 */
export interface PayTradeQuery {
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
  /** 通道商户号 */
  channelMchNo?: string;
  /** 门店号 */
  storeNo?: string;
}

/** 资金交易结果（工作台列表字段） */
export interface PayTradeResult extends MchEntity {
  /** 支付交易号 */
  tradeNo?: string;
  /** 交易形态 */
  tradeType?: string;
  /** 本次交易金额(分) */
  amount?: number;
  /** 资金状态 */
  status?: string;
  /** 标题/商品描述 */
  title?: string;
  /** 支付成功时间 */
  payTime?: string;
  /** 创建时间 */
  createTime?: string;
}
