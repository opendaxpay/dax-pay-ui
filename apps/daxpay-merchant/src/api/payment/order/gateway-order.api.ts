import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 网关支付业务订单 API（商户端）
 */
export const GatewayOrderApi = {
  /**
   * 分页查询网关业务订单
   */
  page(
    params: GatewayOrderQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<GatewayOrderResult>>> {
    return defHttp.get({ url: '/mch/order/gateway-pay/page', params });
  },

  /**
   * 根据ID查询详情
   */
  getById(id: string): Promise<Result<GatewayOrderResult>> {
    return defHttp.get({ url: '/mch/order/gateway-pay/get-by-id', params: { id } });
  },

  /**
   * 同步支付状态
   */
  sync(id: string): Promise<Result<GatewayPaySyncResult>> {
    return defHttp.post({ url: '/mch/order/gateway-pay/sync', params: { id } });
  },
};

/** 网关订单查询参数 */
export interface GatewayOrderQuery {
  mchNo?: string;
  appId?: string;
  /** 平台网关单号 */
  orderNo?: string;
  bizOrderNo?: string;
  title?: string;
  status?: string;
  gatewayType?: string;
  product?: string;
  capability?: string;
  storeNo?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
  amountMin?: number;
  amountMax?: number;
}

/** 网关订单结果 */
export interface GatewayOrderResult extends MchEntity {
  orderNo?: string;
  bizOrderNo?: string;
  gatewayType?: string;
  source?: string;
  title?: string;
  description?: string;
  status?: string;
  notifyUrl?: string;
  returnUrl?: string;
  attach?: string;
  expiredTime?: string;
  amount?: number;
  currency?: string;
  channel?: string;
  method?: string;
  product?: string;
  limitPay?: string;
  clientEnv?: string;
  device?: string;
  payTime?: string;
  closeTime?: string;
  channelMchNo?: string;
  capability?: string;
  channelAppId?: string;
  clientIp?: string;
  storeNo?: string;
  extraParam?: string;
  // 资金凭证(详情)
  tradeNo?: string;
  outOrderNo?: string;
  fundStatus?: string;
  refundableBalance?: number;
  payBody?: string;
  payBodyType?: string;
  buyerId?: string;
  openid?: string;
  provider?: string;
  tradeProduct?: string;
  tradeWay?: string;
  bankType?: string;
  promotionType?: string;
  transOrderNo?: string;
  relationOrderNo?: string;
  errorMsg?: string;
}

export interface GatewayPaySyncResult {
  orderStatus?: string;
  adjust?: boolean;
}
