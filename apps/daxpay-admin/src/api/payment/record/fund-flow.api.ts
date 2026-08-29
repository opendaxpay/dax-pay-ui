import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 资金流水管理 API
 */
export const FundFlowApi = {
  /** 资金流水分页 */
  page(params: FundFlowQuery & { current?: number; size?: number }): Promise<Result<PageResult<FundFlowResult>>> {
    return defHttp.get({ url: '/admin/fund-flow/page', params });
  },

  /** 资金流水详情 */
  getById(id: string): Promise<Result<FundFlowResult>> {
    return defHttp.get({ url: '/admin/fund-flow/get-by-id', params: { id } });
  },
};

/** 资金流水查询 */
export interface FundFlowQuery {
  mchNo?: string;
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
