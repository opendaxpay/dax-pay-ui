import type { UserInfo } from '@vben/types';

import type { Result } from '#/types/web';

import { requestClient } from '#/api/request';

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
   * 修改密码
   */
  updatePassword(password: string, newPassword: string): Promise<Result<void>> {
    return requestClient.post('/user/auth/update-password', {
      password,
      newPassword,
    });
  },
};
