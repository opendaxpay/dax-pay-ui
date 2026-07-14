import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 角色管理 API
 */
export const RoleApi = {
  /**
   * 分页查询角色
   */
  page(params: any): Promise<Result<PageResult<Role>>> {
    return defHttp.get({ url: '/role/page', params });
  },
  /**
   * 获取角色详情
   */
  findById(id: string): Promise<Result<Role>> {
    return defHttp.get({ url: '/role/get', params: { id } });
  },
  /**
   * 添加角色
   */
  add(data: Role): Promise<Result<void>> {
    return defHttp.post({ url: '/role/add', data });
  },
  /**
   * 更新角色
   */
  update(data: Role): Promise<Result<void>> {
    return defHttp.post({ url: '/role/update', data });
  },
  /**
   * 删除角色
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/role/delete', params: { id } });
  },
  /**
   * 判断角色编码是否存在
   */
  existsByCode(code: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/role/exists-by-code', params: { code } });
  },
  /**
   * 判断角色编码是否存在(排除指定ID)
   */
  existsByCodeNotId(code: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/role/exists-by-code-not-id', params: { code, id } });
  },
};

/**
 * 角色
 */
export interface Role extends BaseEntity {
  /** 角色编码 */
  code?: string;
  /** 国际化key */
  i18nKey?: string;
  /** 终端编码 */
  clientCode?: string;
  /** 是否系统内置 */
  internal?: boolean;
  /** 备注 */
  remark?: string;
}
