import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户用户查询参数
 */
export interface MerchantUserQuery {
  /** 商户号（分页未强制，商户端建议传当前 mchNo，避免跨商户串数据） */
  mchNo?: string;
  /** 名称 */
  name?: string;
  /** 账号 */
  account?: string;
  /** 状态 */
  status?: string;
  /** 当前页 */
  current?: number;
  /** 每页大小 */
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
  /** 最后登录时间 */
  lastLoginTime?: string;
  /** 登录次数 */
  loginCount?: number;
  /** 最后登录 IP */
  lastLoginIp?: string;
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
  /** 确认密码 */
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
  /** 是否管理员 */
  administrator?: boolean;
  /** 最后登录时间 */
  lastLoginTime?: string;
  /** 登录次数 */
  loginCount?: number;
  /** 最后登录 IP */
  lastLoginIp?: string;
}

/**
 * 商户用户管理 API（商户端路径 /mch/user/*）
 */
export const MerchantUserApi = {
  /**
   * 分页查询商户用户列表
   */
  page(params: MerchantUserQuery): Promise<Result<PageResult<MerchantUserResult>>> {
    return defHttp.get({ url: '/mch/user/page', params });
  },

  /**
   * 根据 ID 查询用户详情
   */
  findById(id: string): Promise<Result<UserInfoResult>> {
    return defHttp.get({ url: '/mch/user/get', params: { id } });
  },

  /**
   * 新增商户用户
   * 未传密码时由后端生成随机初始密码, 返回明文供一次性转告用户
   */
  add(data: MerchantUserParam): Promise<Result<UserPasswordResult>> {
    return defHttp.post({ url: '/mch/user/add', data });
  },

  /**
   * 编辑商户用户
   */
  update(data: MerchantUserParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/user/update', data });
  },

  /**
   * 分配角色
   */
  assignRole(userId: string, roleId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/user/assign-role', params: { userId, roleId } });
  },

  /**
   * 封禁商户用户
   */
  ban(userId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/user/ban', params: { userId } });
  },

  /**
   * 批量封禁商户用户
   */
  banBatch(userIds: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/user/ban-batch', data: userIds });
  },

  /**
   * 解锁商户用户
   */
  unlock(userId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/user/unlock', params: { userId } });
  },

  /**
   * 批量解锁商户用户
   */
  unlockBatch(userIds: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/user/unlock-batch', data: userIds });
  },

  /**
   * 重置密码
   * 不传密码时由后端生成随机密码, 返回明文供一次性转告用户
   */
  restartPassword(userId: string, newPassword?: string): Promise<Result<UserPasswordResult>> {
    return defHttp.post({ url: '/mch/user/restart-password', data: { userId, newPassword } });
  },

  /**
   * 批量重置密码
   * 不传密码时为每个用户独立生成随机密码, 返回明文列表
   */
  restartPasswordBatch(userIds: string[], newPassword?: string): Promise<Result<UserPasswordResult[]>> {
    return defHttp.post({ url: '/mch/user/restart-password-batch', data: { userIds, newPassword } });
  },
};

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
