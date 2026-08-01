import type { PageResult, Result } from '#/types/web';
import type { BaseEntity } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户用户查询参数
 */
export interface MerchantUserQuery {
  /** 商户号 */
  mchNo?: string;
  /** 名称 */
  name?: string;
  /** 账号 */
  account?: string;
  /** 状态 */
  status?: string;
  /** 当前页 */
  current?: number;
  /** 每页条数 */
  size?: number;
}

/**
 * 商户用户信息
 */
export interface MerchantUserResult extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
  /** 商户名称 */
  mchName?: string;
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
 * 商户用户参数
 */
export interface MerchantUserParam {
  /** 主键 */
  id?: string;
  /** 商户号 */
  mchNo?: string;
  /** 姓名 */
  name?: string;
  /** 账号 */
  account?: string;
  /** 密码 */
  password?: string;
  /** 密码 */
  confirmPassword?: string;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string;
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
 * 商户用户详情(含登录信息)
 */
export interface MerchantUserDetail extends MerchantUserResult {
  /** 最后登录时间 */
  lastLoginTime?: string;
  /** 登录次数 */
  loginCount?: number;
  /** 最后登录IP */
  lastLoginIp?: string;
}

/**
 * 商户用户管理 API
 */
export const MerchantUserApi = {
  /**
   * 分页查询商户用户列表
   */
  page(params: MerchantUserQuery): Promise<PageResult<MerchantUserResult>> {
    return defHttp.get({ url: '/admin/merchant/user/page', params });
  },

  /**
   * 根据ID查询用户详情
   */
  findById(id: string): Promise<Result<MerchantUserDetail>> {
    return defHttp.get({ url: '/admin/merchant/user/get', params: { id } });
  },

  /**
   * 新增商户用户
   */
  add(data: MerchantUserParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/user/add', data });
  },

  /**
   * 编辑商户用户
   */
  update(data: MerchantUserParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/user/update', data });
  },

  /**
   * 分配角色
   */
  assignRole(userId: string, roleId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/user/assign-role', params: { userId, roleId } });
  },

  /**
   * 封禁商户用户
   */
  ban(userId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/user/ban', params: { userId } });
  },

  /**
   * 批量封禁商户用户
   */
  banBatch(userIds: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/user/ban-batch', data: userIds });
  },

  /**
   * 解锁商户用户
   */
  unlock(userId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/user/unlock', params: { userId } });
  },

  /**
   * 批量解锁商户用户
   */
  unlockBatch(userIds: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/user/unlock-batch', data: userIds });
  },

  /**
   * 重置密码
   */
  restartPassword(userId: string, newPassword: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/user/restart-password', data: { userId, newPassword } });
  },

  /**
   * 批量重置密码
   */
  restartPasswordBatch(userIds: string[], newPassword: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/user/restart-password-batch', data: { userIds, newPassword } });
  },
};
