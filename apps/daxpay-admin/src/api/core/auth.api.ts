import type { Result } from '#/types/web';

import { requestClient } from '#/api/request';

/**
 * 认证 API
 */
export const AuthApi = {
  /**
   * 登录
   */
  login(data: LoginParams): Promise<Result<string>> {
    const formData = new URLSearchParams();
    formData.set('account', data.account);
    formData.set('password', data.password);
    formData.set('client', data.client);
    formData.set('loginType', data.loginType);
    // 添加remember参数
    if (data.remember !== undefined) {
      formData.set('remember', String(data.remember));
    }

    return requestClient.post('/token/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      requireNonce: true,
    });
  },
  /**
   * 退出登录
   */
  logout(): Promise<Result<void>> {
    return requestClient.post('/token/logout');
  },
  /**
   * 获取用户权限码
   */
  getPermCodes(): Promise<Result<string[]>> {
    return requestClient.get('/perm/code/find-codes-by-user');
  },
};

/**
 * 登录参数
 */
export interface LoginParams {
  /** 账号 */
  account: string;
  /** 客户端 */
  client: string;
  /** 登录方式 */
  loginType: string;
  /** 密码 */
  password: string;
  /** 记住我 */
  remember?: boolean;
}
