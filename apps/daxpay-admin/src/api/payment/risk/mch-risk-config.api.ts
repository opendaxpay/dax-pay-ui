import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户风控配置 API（运营端 /admin/merchant/risk-config）
 */
export const MchRiskConfigApi = {
  /** 根据商户号查询风控配置 */
  getByMchNo(mchNo: string): Promise<Result<MchRiskConfigVo>> {
    return defHttp.get({ url: '/admin/merchant/risk-config/get-by-mch-no', params: { mchNo } });
  },
  /** 保存或更新风控配置 */
  saveOrUpdate(data: MchRiskConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/risk-config/save-or-update', data });
  },
};

/** 商户风控配置入参 */
export interface MchRiskConfigParam {
  /** 商户号 */
  mchNo: string;
  /** 是否启用地理围栏 */
  geoFenceEnabled?: boolean;
}

/** 商户风控配置 VO */
export interface MchRiskConfigVo extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
  /** 商户名称(翻译) */
  mchName?: string;
  /** 是否启用地理围栏 */
  geoFenceEnabled?: boolean;
}
