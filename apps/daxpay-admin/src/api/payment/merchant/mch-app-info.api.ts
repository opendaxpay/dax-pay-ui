import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户应用信息 API
 */
export const MchAppInfoApi = {
  /**
   * 分页查询商户应用
   */
  page(params: MchAppInfoQuery & { current?: number; size?: number }): Promise<Result<PageResult<MchAppInfoResult>>> {
    return defHttp.get({ url: '/admin/merchant/app-info/page', params });
  },

  /**
   * 启用应用列表(下拉选择器用, 仅返回启用状态)
   */
  enableList(mchNo: string): Promise<Result<MchAppInfoResult[]>> {
    return defHttp.get({ url: '/admin/merchant/app-info/enable-list', params: { mchNo } });
  },

  /**
   * 根据 id 查询商户应用
   */
  get(id: string): Promise<Result<MchAppInfoResult>> {
    return defHttp.get({ url: '/admin/merchant/app-info/get', params: { id } });
  },

  /**
   * 新增商户应用
   */
  add(data: MchAppInfoParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/app-info/add', data });
  },

  /**
   * 修改商户应用
   */
  update(data: MchAppInfoParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/app-info/update', data });
  },

  /**
   * 删除商户应用
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/app-info/delete', params: { id } });
  },

  /**
   * 设为默认应用
   */
  setDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/app-info/set-default', params: { id } });
  },

  /**
   * 取消默认应用
   */
  clearDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/app-info/clear-default', params: { id } });
  },
};

/** 商户应用查询参数 */
export interface MchAppInfoQuery {
  /** 商户号 */
  mchNo?: string;
  /** 应用号 */
  appId?: string;
  /** 应用名称 */
  appName?: string;
  /** 状态 */
  status?: string;
}

/** 商户应用参数 */
export interface MchAppInfoParam {
  /** 主键 */
  id?: string;
  /** 商户号 */
  mchNo?: string;
  /** 应用名称 */
  appName?: string;
  /** 状态 enable / disabled */
  status?: string;
  /** 是否默认应用 */
  defaultApp?: boolean;
}

/** 商户应用结果 */
export interface MchAppInfoResult extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
  /** 商户名称 */
  mchName?: string;
  /** 应用号 */
  appId?: string;
  /** 应用名称 */
  appName?: string;
  /** 状态 */
  status?: string;
  /** 是否默认应用 */
  defaultApp?: boolean;
}
