import type { MchEntity, PageResult, Result } from '#/types/web';

import { downloadExportFile } from '@daxpay/ui-biz/utils/export-download';

import { defHttp, requestClient } from '#/api/request';

/**
 * 网关支付业务订单管理 API
 */
export const GatewayOrderApi = {
  /**
   * 分页查询网关业务订单
   */
  page(
    params: GatewayOrderQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<GatewayOrderResult>>> {
    return defHttp.get({ url: '/admin/order/gateway-pay/page', params });
  },

  /**
   * 导出当前查询条件下的数据
   *
   * 服务端为内存生成后落响应, 失败时返回 JSON(而非文件);
   * 错误文案已在 downloadExportFile 内统一提示, 返回 false 便于调用方复位按钮状态。
   */
  exportExcel(query: GatewayOrderQuery, options: { failedText: string; fileName: string }): Promise<boolean> {
    return downloadExportFile({
      client: requestClient,
      url: '/admin/order/gateway-pay/export',
      params: { ...query },
      fileName: options.fileName,
      failedText: options.failedText,
    });
  },

  /**
   * 根据ID查询详情
   */
  getById(id: string): Promise<Result<GatewayOrderResult>> {
    return defHttp.get({ url: '/admin/order/gateway-pay/get-by-id', params: { id } });
  },

  /**
   * 同步支付状态
   */
  sync(id: string): Promise<Result<GatewayPaySyncResult>> {
    return defHttp.post({ url: '/admin/order/gateway-pay/sync', params: { id } });
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
