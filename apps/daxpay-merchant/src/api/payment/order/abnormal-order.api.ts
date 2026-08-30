import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 异常订单 API(商户端, 只读)
 */
export const AbnormalOrderApi = {
  /** 异常订单分页 */
  page(
    params: AbnormalOrderQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<AbnormalOrderResult>>> {
    return defHttp.get({ url: '/mch/order/abnormal-order/page', params });
  },

  /** 异常订单详情 */
  getById(id: string): Promise<Result<AbnormalOrderResult>> {
    return defHttp.get({ url: '/mch/order/abnormal-order/get-by-id', params: { id } });
  },
};

/** 异常订单查询 */
export interface AbnormalOrderQuery {
  tradeNo?: string;
  bizOrderNo?: string;
  abnormalType?: string;
  source?: string;
  channel?: string;
  provider?: string;
  outOrderNo?: string;
  handleStatus?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
}

/** 异常订单结果 */
export interface AbnormalOrderResult extends MchEntity {
  appId?: string;
  tradeNo?: string;
  bizOrderNo?: string;
  tradeType?: string;
  title?: string;
  amount?: number;
  currency?: string;
  tradeStatus?: string;
  abnormalType?: string;
  source?: string;
  channel?: string;
  provider?: string;
  channelMchNo?: string;
  outOrderNo?: string;
  channelStatus?: string;
  callbackNotifyInfo?: string;
  handleStatus?: string;
  handleAction?: string;
  handler?: string;
  handleTime?: string;
  handleRemark?: string;
}
