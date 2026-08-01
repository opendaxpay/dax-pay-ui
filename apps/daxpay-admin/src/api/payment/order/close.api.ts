import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 订单关闭统一 API(网关/普通收归入口, 前端按 type 区分)
 */
export const OrderCloseApi = {
  /**
   * 关闭/撤销订单(统一入口)
   * @param id        业务容器ID(网关订单或普通订单主键)
   * @param type      容器类型: gateway=网关支付, normal=普通支付
   * @param useCancel 是否使用撤销(撤销可退已支付, 关闭仅关未支付)
   */
  close(id: string, type: 'gateway' | 'normal', useCancel = false): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/order/close',
      params: { id, type, useCancel },
    });
  },
};
