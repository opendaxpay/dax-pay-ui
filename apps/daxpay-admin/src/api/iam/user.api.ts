import type { PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 用户管理 API
 */
export const UserApi = {
  /**
   * 分页查询用户列表
   */
  page(params: UserQuery): Promise<PageResult<User>> {
    return defHttp.get({ url: '/user/admin/page', params });
  },
  /**
   * 根据ID查询用户详情
   */
  findById(id: string): Promise<Result<User>> {
    return defHttp.get({ url: '/user/admin/get', params: { id } });
  },
  /**
   * 新增用户
   * 未传密码时由后端生成随机初始密码, 返回明文供一次性转告用户
   */
  add(data: User): Promise<Result<UserPasswordResult>> {
    return defHttp.post({ url: '/user/admin/add', data });
  },
  /**
   * 编辑用户
   */
  update(data: User): Promise<Result<void>> {
    return defHttp.post({ url: '/user/admin/update', data });
  },
  /**
   * 封禁用户
   */
  ban(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/user/admin/ban', params: { userId: id } });
  },
  /**
   * 批量封禁用户
   */
  banBatch(userIds: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/user/admin/ban-batch', data: { userIds } });
  },
  /**
   * 锁定用户
   */
  lock(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/user/admin/lock', params: { userId: id } });
  },
  /**
   * 批量锁定用户
   */
  lockBatch(userIds: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/user/admin/lock-batch', data: { userIds } });
  },
  /**
   * 解锁用户
   */
  unlock(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/user/admin/unlock', params: { userId: id } });
  },
  /**
   * 批量解锁用户
   */
  unlockBatch(userIds: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/user/admin/unlock-batch', data: { userIds } });
  },
  /**
   * 重置密码
   * 不传密码时由后端生成随机密码, 返回明文供一次性转告用户
   */
  restartPassword(id: string, newPassword?: string): Promise<Result<UserPasswordResult>> {
    return defHttp.post({ url: '/user/admin/restart-password', data: { userId: id, newPassword } });
  },
  /**
   * 批量重置密码
   * 不传密码时为每个用户独立生成随机密码, 返回明文列表
   */
  restartPasswordBatch(userIds: string[], newPassword?: string): Promise<Result<UserPasswordResult[]>> {
    return defHttp.post({ url: '/user/admin/restart-password-batch', data: { userIds, newPassword } });
  },
  /**
   * 校验账号是否已存在
   */
  existsAccountByClient(account: string, clientCode: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/user/check/exists-account-by-client', params: { account, clientCode } });
  },
  /**
   * 校验手机号是否已存在
   */
  existsPhoneByClient(phone: string, clientCode: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/user/check/exists-phone-by-client', params: { phone, clientCode } });
  },
  /**
   * 校验邮箱是否已存在
   */
  existsEmailByClient(email: string, clientCode: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/user/check/exists-email-by-client', params: { email, clientCode } });
  },
};

/**
 * 用户角色 API
 */
export const UserRoleApi = {
  /**
   * 查询用户已分配的角色（单角色模式）
   */
  findRolesByUser(userId: string): Promise<Result<null | UserRole>> {
    return defHttp.get({ url: '/user/role/find-roles-by-user', params: { userId } });
  },
  /**
   * 查询用户已分配的角色ID列表
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
  /**
   * 保存用户角色分配（单角色模式）
   */
  saveAssign(userId: string, roleId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/user/role/save-assign', data: { userId, roleId } });
  },
};

/**
 * 用户信息
 */
export interface User {
  /** 用户ID */
  id?: string;
  /** 用户名称 */
  name?: string;
  /** 用户账号 */
  account?: string;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 客户端编码 */
  clientCode?: string;
  /** 状态 */
  status?: string;
  /** 是否管理员 */
  administrator?: boolean;
  /** 密码（新增/编辑时使用） */
  password?: string;
  /** 创建时间 */
  createTime?: string;
  /** 最后登录时间 */
  lastLoginTime?: string;
  /** 头像 */
  avatar?: string;
}

/**
 * 用户查询参数
 */
export interface UserQuery {
  /** 当前页 */
  current: number;
  /** 每页大小 */
  size: number;
  /** 用户名称 */
  name?: string;
  /** 用户账号 */
  account?: string;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 客户端编码 */
  clientCode?: string;
  /** 状态 */
  status?: string;
}

/**
 * 用户角色
 */
export interface UserRole {
  /** 角色ID */
  id?: string;
  /** 角色编码 */
  code?: string;
  /** 国际化key */
  i18nKey?: string;
  /** 客户端编码 */
  clientCode?: string;
}

/**
 * 用户新增表单
 */
export interface UserAddForm {
  /** 用户名称 */
  name?: string;
  /** 用户账号 */
  account?: string;
  /** 密码 */
  password?: string;
  /** 确认密码 */
  confirmPassword?: string;
}

/**
 * 重置密码表单
 */
export interface ResetPasswordForm {
  /** 新密码 */
  newPassword?: string;
  /** 确认密码 */
  confirmPassword?: string;
}

/**
 * 初始密码结果(重置/新建未传密码时由后端生成, 明文仅本次响应返回一次)
 */
export interface UserPasswordResult {
  /** 用户ID */
  userId?: string;
  /** 登录账号 */
  account?: string;
  /** 用户名称 */
  name?: string;
  /** 初始密码明文 */
  password?: string;
}
