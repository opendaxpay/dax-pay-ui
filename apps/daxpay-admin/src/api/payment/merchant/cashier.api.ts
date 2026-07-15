import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 收银台配置 API
 * 对接后端 GatewayCashierConfigAdminController
 */
export const CashierConfigApi = {
  /** 按应用与分桶查询支付项列表 */
  list(params: {
    appId: string;
    cashierType: string;
    clientEnv?: string;
  }): Promise<Result<CashierItemResult[]>> {
    return defHttp.get({
      url: '/admin/gateway/cashier-config/list',
      params,
    });
  },

  /** 按 ID 查询支付项 */
  getById(id: string): Promise<Result<CashierItemResult>> {
    return defHttp.get({
      url: '/admin/gateway/cashier-config/get-by-id',
      params: { id },
    });
  },

  /** 新建支付项 */
  save(data: CashierItemParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/gateway/cashier-config/save',
      data,
    });
  },

  /** 更新支付项 */
  update(data: CashierItemParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/gateway/cashier-config/update',
      data,
    });
  },

  /** 删除支付项 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/gateway/cashier-config/delete',
      params: { id },
    });
  },
};

/** 收银台支付项结果 */
export interface CashierItemResult extends BaseEntity {
  appId?: string;
  mchNo?: string;
  /** 收银台类型: h5/web/mini */
  cashierType?: string;
  /** H5 五档 / MINI 四档(含云闪付); WEB 为空 */
  clientEnv?: string;
  name?: string;
  icon?: string;
  recommend?: boolean;
  sortNo?: number;
  /** 解析模式: method/direct */
  resolveMode?: string;
  method?: string;
  channelMchNo?: string;
  capability?: string;
}

/** 收银台支付项参数 */
export interface CashierItemParam {
  id?: string;
  mchNo: string;
  appId: string;
  cashierType: string;
  clientEnv?: string;
  name: string;
  icon?: string;
  recommend?: boolean;
  sortNo?: number;
  resolveMode: string;
  method?: string;
  channelMchNo?: string;
  capability?: string;
}
