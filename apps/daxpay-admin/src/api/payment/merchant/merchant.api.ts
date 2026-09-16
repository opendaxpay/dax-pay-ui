import type { UserPasswordResult } from './merchant-user.api';

import type { BaseEntity, LabelValue, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户信息 API
 */
export const MerchantApi = {
  /**
   * 商户分页查询
   */
  page(params: MerchantQuery): Promise<Result<PageResult<MerchantInfo>>> {
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
   * 未传管理员密码时由后端生成随机初始密码, 返回明文供一次性转告商户
   */
  add(data: MerchantCreateParam): Promise<Result<UserPasswordResult>> {
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
   * @param silent 静默错误(订单页等跨模块引用时, 纯交易角色无商户查看权限 403 不弹全局 toast, 降级为空下拉)
   */
  dropdown(silent = false): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/admin/merchant/dropdown', silentError: silent });
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
  /** 管理员密码(RSA 加密), 可选; 不传由后端生成随机初始密码 */
  password?: string;
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

export interface MerchantQuery {
  /** 当前页 */
  current?: number;
  /** 每页条数 */
  size?: number;
  /** 商户名称 */
  mchName?: string;
  /** 主体类型 */
  subjectType?: string;
  /** 商户状态 */
  status?: string;
}
