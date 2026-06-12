import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 服务商用户管理 API
 */
export const IsvUserApi = {
  /**
   * 分页查询
   */
  page(params: any): Promise<Result<PageResult<IsvUserResult>>> {
    return defHttp.get({ url: '/isv/user/page', params });
  },

  /**
   * 根据ID查询用户详情
   */
  findById(id: string): Promise<Result<UserInfoResult>> {
    return defHttp.get({ url: '/isv/user/get', params: { id } });
  },

  /**
   * 新增用户
   */
  add(data: IsvUserParam): Promise<Result<void>> {
    return defHttp.post({ url: '/isv/user/add', data });
  },

  /**
   * 修改用户
   */
  update(data: UserInfoParam): Promise<Result<void>> {
    return defHttp.post({ url: '/isv/user/update', data });
  },

  /**
   * 分配角色
   */
  assignRole(userId: string, roleId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/isv/user/assign-role', params: { userId, roleId } });
  },

  /**
   * 重置密码
   */
  restartPassword(userId: string, newPassword: string): Promise<Result<void>> {
    return defHttp.post({ url: '/isv/user/restart-password', data: { userId, newPassword } });
  },

  /**
   * 批量重置密码
   */
  restartPasswordBatch(userIds: string[], newPassword: string): Promise<Result<void>> {
    return defHttp.post({ url: '/isv/user/restart-password-batch', data: { userIds, newPassword } });
  },

  /**
   * 封禁用户
   */
  ban(userId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/isv/user/ban', params: { userId } });
  },

  /**
   * 批量封禁
   */
  banBatch(userIds: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/isv/user/ban-batch', data: userIds });
  },

  /**
   * 解锁用户
   */
  unlock(userId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/isv/user/unlock', params: { userId } });
  },

  /**
   * 批量解锁
   */
  unlockBatch(userIds: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/isv/user/unlock-batch', data: userIds });
  },
};

/**
 * 服务商用户信息
 */
export interface IsvUserResult extends BaseEntity {
  /** 服务商号 */
  isvNo?: string;
  /** 服务商名称 */
  isvName?: string;
  /** 姓名 */
  name?: string;
  /** 账号 */
  account?: string;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 是否管理员 */
  administrator?: boolean;
  /** 账号状态 */
  status?: string;
}

/**
 * 服务商用户参数
 */
export interface IsvUserParam {
  /** 服务商号 */
  isvNo: string;
  /** 姓名 */
  name: string;
  /** 账号 */
  account: string;
  /** 密码 */
  password: string;
}

/**
 * 用户信息结果
 */
export interface UserInfoResult extends BaseEntity {
  /** 姓名 */
  name?: string;
  /** 账号 */
  account?: string;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 状态 */
  status?: string;
}

/**
 * 用户信息参数
 */
export interface UserInfoParam {
  /** 主键 */
  id?: string;
  /** 姓名 */
  name?: string;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string;
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
