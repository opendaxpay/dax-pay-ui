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
    // 验证码参数（登录失败达阈值后必传）
    if (data.captchaKey) {
      formData.set('captchaKey', data.captchaKey);
    }
    if (data.captchaCode) {
      formData.set('captchaCode', data.captchaCode);
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
   * 获取登录页上下文（是否启用验证码、支持的登录方式等）
   */
  getLoginContent(): Promise<Result<LoginContentResult>> {
    return requestClient.post('/token/login-content', {});
  },
  /**
   * 获取图形验证码
   */
  getCaptchaImage(): Promise<Result<CaptchaDataResult>> {
    return requestClient.get('/captcha/image');
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
  /** 验证码标识 */
  captchaKey?: string;
  /** 验证码内容 */
  captchaCode?: string;
}

/**
 * 登录页上下文
 */
export interface LoginContentResult {
  /** 支持的登录方式 */
  loginTypes: string[];
  /** 是否启用验证码触发 */
  enableCaptcha: boolean;
  /** 密码是否加密传输 */
  passwordEncrypted: boolean;
}

/**
 * 图形验证码数据
 */
export interface CaptchaDataResult {
  /** 验证码标识KEY */
  captchaKey: string;
  /** 验证码base64数据 */
  captchaData: string;
}
