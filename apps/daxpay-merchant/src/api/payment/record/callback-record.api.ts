import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 通道入站回调记录 API（商户端）
 */
export const PayCallbackRecordApi = {
  /** 回调记录分页 */
  page(params: PayCallbackRecordQuery & { current?: number; size?: number }): Promise<Result<PageResult<PayCallbackRecordResult>>> {
    return defHttp.get({ url: '/mch/callback-record/page', params });
  },

  /** 回调记录详情 */
  getById(id: string): Promise<Result<PayCallbackRecordResult>> {
    return defHttp.get({ url: '/mch/callback-record/get-by-id', params: { id } });
  },
};

/** 回调记录查询 */
export interface PayCallbackRecordQuery {
  mchNo?: string;
  appId?: string;
  channelMchNo?: string;
  tradeNo?: string;
  outTradeNo?: string;
  product?: string;
  callbackType?: string;
  status?: string;
}

/** 回调记录结果 */
export interface PayCallbackRecordResult extends MchEntity {
  appId?: string;
  channelMchNo?: string;
  channelMerchantName?: string;
  tradeNo?: string;
  outTradeNo?: string;
  product?: string;
  callbackType?: string;
  notifyInfo?: string;
  status?: string;
  errorMsg?: string;
}
