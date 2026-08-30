import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 资金流水 API(商户端, 只读)
 */
export const FundFlowApi = {
  /** 资金流水分页 */
  page(params: FundFlowQuery & { current?: number; size?: number }): Promise<Result<PageResult<FundFlowResult>>> {
    return defHttp.get({ url: '/mch/fund-flow/page', params });
  },

  /** 资金流水详情 */
  getById(id: string): Promise<Result<FundFlowResult>> {
    return defHttp.get({ url: '/mch/fund-flow/get-by-id', params: { id } });
  },
};

/** 资金流水查询 */
export interface FundFlowQuery {
  flowType?: string;
  tradeNo?: string;
  refundNo?: string;
  bizOrderNo?: string;
  channel?: string;
  provider?: string;
  outOrderNo?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
}

/** 资金流水结果 */
export interface FundFlowResult extends MchEntity {
  appId?: string;
  flowType?: string;
  tradeNo?: string;
  refundNo?: string;
  bizOrderNo?: string;
  title?: string;
  amount?: number;
  currency?: string;
  channel?: string;
  provider?: string;
  channelMchNo?: string;
  outOrderNo?: string;
  finishTime?: string;
}
