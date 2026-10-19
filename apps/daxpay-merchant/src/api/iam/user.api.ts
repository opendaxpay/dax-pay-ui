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
 * 用户角色 API（商户端专用 /mch/user/role/*，merchant:user 域）
 *
 * 原直连平台级 /user/role/*（完整码 iam:user:assign-role 挂运营端菜单），商户端角色绑不上恒 403，改走商户域读端点
 */
export const UserRoleApi = {
  /**
   * 查询用户已分配的角色 ID 列表
   */
  findRoleIdsByUser(userId: string): Promise<Result<string[]>> {
    return defHttp.get({ url: '/mch/user/role/find-role-ids-by-user', params: { userId } });
  },
  /**
   * 查询用户可分配的角色列表（同终端）
   */
  findAssignableRolesByUser(userId: string): Promise<Result<UserRole[]>> {
    return defHttp.get({ url: '/mch/user/role/find-assignable-roles-by-user', params: { userId } });
  },
};
