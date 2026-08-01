import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 订单关闭统一 API(网关/普通收归入口, 前端按 type 区分)
 */
export const OrderCloseApi = {
  /**
   * 关闭订单(统一入口)
   * @param containerId 业务容器ID(网关订单或普通订单主键; 资金凭证页传 row.containerId)
   * @param tradeType   容器类型: gateway=网关支付, normal=普通支付(资金凭证页可直接传 row.tradeType)
   */
  close(containerId: string, tradeType: string): Promise<Result<void>> {
    return defHttp.post({
      url: '/mch/order/close',
      data: { containerId, tradeType },
    });
  },
};
