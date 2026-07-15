import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 风险命中记录 API（运营端 /admin/pay/risk-hit）
 */
export const PayRiskHitApi = {
  /** 分页查询 */
  page(
    params: PayRiskHitQuery & { current: number; size: number },
  ): Promise<Result<PageResult<PayRiskHitVo>>> {
    return defHttp.get({ url: '/admin/pay/risk-hit/page', params });
  },

  /** 详情 */
  get(id: string): Promise<Result<PayRiskHitVo>> {
    return defHttp.get({ url: '/admin/pay/risk-hit/get', params: { id } });
  },

  /** 处理命中 */
  handle(data: PayRiskHitHandleParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/pay/risk-hit/handle', data });
  },
};

/** 查询参数 */
export interface PayRiskHitQuery {
  phase?: string;
  hitType?: string;
  hitValue?: string;
  mchNo?: string;
  handleStatus?: string;
  scene?: string;
}

/** 处理参数 */
export interface PayRiskHitHandleParam {
  id: string;
  handleStatus: string;
  handleRemark?: string;
}

/** 列表/详情 VO */
export interface PayRiskHitVo extends BaseEntity {
  phase?: string;
  hitType?: string;
  hitValue?: string;
  blacklistId?: string;
  mchNo?: string;
  appId?: string;
  tradeNo?: string;
  orderNo?: string;
  bizOrderNo?: string;
  tradeType?: string;
  method?: string;
  product?: string;
  channel?: string;
  clientIp?: string;
  openid?: string;
  buyerId?: string;
  scene?: string;
  handleStatus?: string;
  handleRemark?: string;
  handleUserId?: string;
  handleTime?: string;
  remark?: string;
}
