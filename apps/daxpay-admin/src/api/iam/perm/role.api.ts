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
  /**
   * 判断角色中文名称是否存在
   */
  existsByNameCn(nameCn: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/role/exists-by-name-cn', params: { nameCn } });
  },
  /**
   * 判断角色中文名称是否存在(排除指定ID)
   */
  existsByNameCnNotId(nameCn: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/role/exists-by-name-cn-not-id', params: { nameCn, id } });
  },
  /**
   * 判断角色英文名称是否存在
   */
  existsByNameEn(nameEn: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/role/exists-by-name-en', params: { nameEn } });
  },
  /**
   * 判断角色英文名称是否存在(排除指定ID)
   */
  existsByNameEnNotId(nameEn: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/role/exists-by-name-en-not-id', params: { nameEn, id } });
  },
};

/**
 * 角色
 */
export interface Role extends BaseEntity {
  /** 角色编码 */
  code?: string;
  /** 中文名称 */
  nameCn?: string;
  /** 英文名称 */
  nameEn?: string;
  /** 终端编码 */
  clientCode?: string;
  /** 是否系统内置 */
  internal?: boolean;
  /** 备注 */
  remark?: string;
}
