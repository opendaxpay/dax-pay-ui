import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 用户角色
 */
export interface UserRole {
  /** 角色 ID */
  id?: string;
  /** 角色编码 */
  code?: string;
  /** 国际化 key */
  i18nKey?: string;
  /** 客户端编码 */
  clientCode?: string;
}

/**
 * 用户角色 API（平台 IAM /user/role/*，商户端共用）
 */
export const UserRoleApi = {
  /**
   * 查询用户已分配的角色 ID 列表
   */
  findRoleIdsByUser(userId: string): Promise<Result<string[]>> {
    return defHttp.get({ url: '/user/role/find-role-ids-by-user', params: { userId } });
  },
  /**
   * 查询用户可分配的角色列表（同终端）
   */
  findAssignableRolesByUser(userId: string): Promise<Result<UserRole[]>> {
    return defHttp.get({ url: '/user/role/find-assignable-roles-by-user', params: { userId } });
  },
};
