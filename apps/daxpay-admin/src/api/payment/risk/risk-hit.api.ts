import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 风险命中记录 API（运营端 /admin/pay/risk-hit）
 */
export const PayRiskHitApi = {
  /** 分页查询 */
  page(params: PayRiskHitQuery & { current: number; size: number }): Promise<Result<PageResult<PayRiskHitVo>>> {
    return defHttp.get({ url: '/admin/pay/risk-hit/page', params });
  },

  /** 详情 */
  get(id: string): Promise<Result<PayRiskHitVo>> {
    return defHttp.get({ url: '/admin/pay/risk-hit/get', params: { id } });
  },
};

/** 查询参数 */
export interface PayRiskHitQuery {
  phase?: string;
  hitType?: string;
  hitValue?: string;
  mchNo?: string;
  scene?: string;
}

/** 列表/详情 VO */
export interface PayRiskHitVo extends BaseEntity {
  phase?: string;
  hitType?: string;
  hitValue?: string;
  blacklistId?: string;
  mchNo?: string;
  /** 商户名称(由 mchNo 翻译) */
  mchName?: string;
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
  remark?: string;
  /** 客户端IP归属城市 */
  clientCity?: string;
  /** 门店所在城市 */
  storeCity?: string;
  /** 门店号 */
  storeNo?: string;
  /** 地理围栏命中时生效的策略(strict/balanced/loose) */
  geoFenceStrategy?: string;
}
