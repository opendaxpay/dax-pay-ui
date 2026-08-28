import type { Result } from '#/types/web';

import { requestClient } from '#/api/request';

/**
 * 找回密码 API(登录页公开接口, 邮箱验证码方式)
 */
export const ForgetPasswordApi = {
  /**
   * 发送找回密码验证码
   * 说明: 需同时携带用户账户与邮箱, 无论账户与邮箱是否匹配已验证, 后端统一返回流程ID与一致的成功响应, 不泄露账号存在性
   */
  sendCode(data: ForgetSendCodeParams): Promise<Result<ForgetSendCodeResult>> {
    return requestClient.post('/token/forget/send-code', data, {
      requireNonce: true,
    });
  },

  /**
   * 重置密码(邮箱验证码 + 新密码, 密码 RSA 加密传输)
   */
  resetPassword(data: ForgetResetPasswordParams): Promise<Result<void>> {
    return requestClient.post('/token/forget/reset-password', data, {
      requireNonce: true,
    });
  },
};

/**
 * 发送验证码参数
 */
export interface ForgetSendCodeParams {
  /** 终端Code */
  clientId: string;
  /** 用户账户(登录账号) */
  account: string;
  /** 已绑定的邮箱 */
  email: string;
  /** 图形验证码key */
  captchaKey: string;
  /** 图形验证码 */
  captchaCode: string;
}

/**
 * 发送验证码结果
 */
export interface ForgetSendCodeResult {
  /** 找回流程ID(重置密码时携带) */
  flowId: string;
}

/**
 * 重置密码参数
 */
export interface ForgetResetPasswordParams {
  /** 找回流程ID */
  flowId: string;
  /** 邮箱验证码 */
  code: string;
  /** 新密码(RSA加密传输) */
  password: string;
}
