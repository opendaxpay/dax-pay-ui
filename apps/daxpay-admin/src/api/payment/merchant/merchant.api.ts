import type { BaseEntity, LabelValue, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户信息 API
 */
export const MerchantApi = {
  /**
   * 商户分页查询
   */
  page(params: any): Promise<Result<PageResult<MerchantInfo>>> {
    return defHttp.get({ url: '/admin/merchant/page', params });
  },
  /**
   * 获取商户详情
   */
  findById(id: string): Promise<Result<MerchantInfo>> {
    return defHttp.get({ url: '/admin/merchant/get', params: { id } });
  },
  /**
   * 新增商户
   */
  add(data: MerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/add', data });
  },
  /**
   * 更新商户
   */
  update(data: MerchantParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/update', data });
  },
  /**
   * 删除商户
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/delete', params: { id } });
  },
  /**
   * 启用商户
   */
  enable(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/enable', params: { id } });
  },
  /**
   * 禁用商户
   */
  disable(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/disable', params: { id } });
  },
  /**
   * 根据商户号查询商户信息
   */
  findByMchNo(mchNo: string): Promise<Result<MerchantInfo>> {
    return defHttp.get({ url: '/admin/merchant/get-by-mch-no', params: { mchNo } });
  },
  /**
   * 商户下拉列表
   */
  dropdown(): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/admin/merchant/dropdown' });
  },
};

/**
 * 商户信息
 */
export interface MerchantInfo extends BaseEntity {
  mchNo?: string;
  mchName?: string;
  mchShortName?: string;
  subjectType?: string;
  status?: string;
  adminUserId?: number;
}

/**
 * 商户创建参数
 */
export interface MerchantCreateParam {
  mchName: string;
  mchShortName: string;
  subjectType: string;
  account: string;
  password: string;
}

/**
 * 商户修改参数
 */
export interface MerchantParam extends BaseEntity {
  mchName?: string;
  mchShortName?: string;
  subjectType?: string;
  status?: string;
}
