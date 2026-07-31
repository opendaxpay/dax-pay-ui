import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户应用信息 API（商户端）
 *
 * 登录态已绑定当前商户，列表/分页无需传 mchNo。
 */
export const MchAppInfoApi = {
  /**
   * 分页查询商户应用
   */
  page(params: MchAppInfoQuery & { current?: number; size?: number }): Promise<Result<PageResult<MchAppInfoResult>>> {
    return defHttp.get({ url: '/mch/app-info/page', params });
  },

  /**
   * 当前商户下全部应用（下拉选择器用）
   */
  list(): Promise<Result<MchAppInfoResult[]>> {
    return defHttp.get({ url: '/mch/app-info/list' });
  },

  /**
   * 当前商户下启用应用列表(下拉选择器用, 仅返回启用状态)
   */
  enableList(): Promise<Result<MchAppInfoResult[]>> {
    return defHttp.get({ url: '/mch/app-info/enable-list' });
  },

  /**
   * 根据 id 查询商户应用
   */
  get(id: string): Promise<Result<MchAppInfoResult>> {
    return defHttp.get({ url: '/mch/app-info/get', params: { id } });
  },

  /**
   * 根据应用号查询
   */
  getByAppId(appId: string): Promise<Result<MchAppInfoResult>> {
    return defHttp.get({ url: '/mch/app-info/get-by-app-id', params: { appId } });
  },

  /**
   * 新增商户应用
   */
  add(data: MchAppInfoParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/app-info/add', data });
  },

  /**
   * 修改商户应用
   */
  update(data: MchAppInfoParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/app-info/update', data });
  },

  /**
   * 删除商户应用
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/app-info/delete', params: { id } });
  },

  /**
   * 设为默认应用
   */
  setDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/app-info/set-default', params: { id } });
  },

  /**
   * 取消默认应用
   */
  clearDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/app-info/clear-default', params: { id } });
  },
};

/** 商户应用查询参数 */
export interface MchAppInfoQuery {
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
  /** 商户号（后端强制当前上下文，可省略） */
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
