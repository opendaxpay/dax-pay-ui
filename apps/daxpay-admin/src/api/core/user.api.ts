import type { Result } from '#/types/web';

import { requestClient } from '#/api/request';

/**
 * 用户基础信息
 */
export interface UserBaseInfo {
  /** 主键ID */
  id?: string;
  /** 名称 */
  name?: string;
  /** 性别 */
  sex?: string;
  /** 头像 */
  avatar?: string;
  /** 生日 */
  birthday?: string;
  /** 邮箱 */
  email?: string;
}

/**
 * 用户基础信息修改参数
 *
 * email 不在本参数受理: 邮箱是找回密码的安全凭证, 绑定/换绑/解绑走 EmailApi 验证流程
 * phone 不在本参数受理: 手机号功能已冻结, 待接入短信验证后启用
 */
export interface UserBaseInfoParam {
  /** 名称 */
  name?: string;
  /** 性别 */
  sex?: string;
}

/**
 * 密码状态（初始密码/过期标记, 用于登录后强制改密引导）
 */
export interface PasswordStatus {
  /** 是否已过期 */
  expired: boolean;
  /** 是否即将过期(7天内) */
  expiringSoon: boolean;
  /** 过期时间 (UTC ISO) */
  expireTime: null | string;
  /** 是否初始密码(管理员代设, 需首次登录修改) */
  initialPassword: boolean;
}

/**
 * 登录后用户信息
 */
export interface LoginAfterUserInfoResult {
  /** 主键ID */
  id?: string;
  /** 登录账号 */
  account?: string;
  /** 名称 */
  name?: string;
  /** 头像 */
  avatar?: string;
  /** 密码状态 */
  passwordStatus?: PasswordStatus;
}

/**
 * 用户 API
 */
export const UserCommonApi = {
  /**
   * 获取用户信息
   */
  getUserInfo(): Promise<Result<LoginAfterUserInfoResult>> {
    return requestClient.get('/user/auth/get-login-after-user-info');
  },
  /**
   * 获取用户基础信息
   */
  getUserBaseInfo(): Promise<Result<UserBaseInfo>> {
    return requestClient.get('/user/auth/get-user-base-info');
  },
  /**
   * 修改用户基础信息
   */
  updateBaseInfo(data: UserBaseInfoParam): Promise<Result<void>> {
    return requestClient.post('/user/auth/update-base-info', data);
  },
  /**
   * 修改密码
   */
  updatePassword(password: string, newPassword: string): Promise<Result<void>> {
    return requestClient.post('/user/auth/update-password', {
      password,
      newPassword,
    });
  },
};
