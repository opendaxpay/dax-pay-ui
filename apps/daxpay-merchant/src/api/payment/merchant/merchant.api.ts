import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户信息 API（商户端）
 *
 * 登录态已绑定当前商户，通过 GET /merchant/get 取资料；无需 URL 传 mchNo。
 */
export const MerchantApi = {
  /**
   * 获取当前登录商户信息
   */
  get(): Promise<Result<MerchantInfo>> {
    return defHttp.get({ url: '/merchant/get' });
  },
  /**
   * 更新当前商户资料（mchNo 由后端 PaymentContext 决定）
   */
  update(data: MerchantParam): Promise<Result<void>> {
    return defHttp.post({ url: '/merchant/update', data });
  },
};

/**
 * 商户信息
 */
export interface MerchantInfo extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
  /** 商户名称 */
  mchName?: string;
  /** 商户简称 */
  mchShortName?: string;
  /** 主体类型 */
  subjectType?: string;
  /** 状态 */
  status?: string;
  /** 管理员用户 ID */
  adminUserId?: string;
}

/**
 * 商户修改参数
 */
export interface MerchantParam extends BaseEntity {
  /** 商户名称 */
  mchName?: string;
  /** 商户简称 */
  mchShortName?: string;
  /** 主体类型 */
  subjectType?: string;
  /** 状态 */
  status?: string;
}
