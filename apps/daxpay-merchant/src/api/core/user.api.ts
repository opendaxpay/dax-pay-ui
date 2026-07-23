import type { UserInfo } from '@vben/types';

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
  /** 手机号 */
  phone?: string;
}

  /**
   * 用户基础信息修改参数
   */
  export interface UserBaseInfoParam {
    /** 名称 */
    name?: string;
    /** 性别 */
    sex?: string;
    /** 邮箱 */
    email?: string;
    /** 手机号 */
    phone?: string;
  }

/**
 * 用户 API
 */
export const UserCommonApi = {
  /**
   * 获取用户信息
   */
  getUserInfo(): Promise<Result<UserInfo>> {
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
