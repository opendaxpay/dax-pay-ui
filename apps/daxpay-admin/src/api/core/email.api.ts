import type { Result } from '#/types/web';

import { requestClient } from '#/api/request';

/**
 * 用户邮箱绑定 API(个人安全设置)
 *
 * 邮箱作为找回密码的安全凭证, 绑定/换绑走"登录密码确认 + 新邮箱验证码"双确认
 */
export const EmailApi = {
  /**
   * 查询邮箱绑定状态
   */
  getInfo(): Promise<Result<EmailInfoResult>> {
    return requestClient.get('/user/auth/email/get-info');
  },

  /**
   * 发送邮箱绑定验证码(登录密码 RSA 加密确认, 验证码发至新邮箱)
   */
  sendBindCode(data: EmailBindSendCodeParams): Promise<Result<void>> {
    return requestClient.post('/user/auth/email/send-bind-code', data);
  },

  /**
   * 确认邮箱绑定(验证码校验通过后生效, 换绑成功后旧邮箱会收到变更通知)
   */
  bindConfirm(data: EmailBindConfirmParams): Promise<Result<void>> {
    return requestClient.post('/user/auth/email/bind-confirm', data);
  },

  /**
   * 发送邮箱解绑验证码(登录密码 RSA 加密确认, 验证码发至当前绑定邮箱)
   */
  sendUnbindCode(data: EmailUnbindSendCodeParams): Promise<Result<void>> {
    return requestClient.post('/user/auth/email/send-unbind-code', data);
  },

  /**
   * 解绑邮箱(登录密码 RSA 加密 + 邮箱验证码双确认, 解绑后旧邮箱会收到解绑通知)
   */
  unbind(data: EmailUnbindParams): Promise<Result<void>> {
    return requestClient.post('/user/auth/email/unbind', data);
  },
};

/**
 * 邮箱绑定状态
 */
export interface EmailInfoResult {
  /** 绑定邮箱(未绑定为null) */
  email?: null | string;
}

/**
 * 发送绑定验证码参数
 */
export interface EmailBindSendCodeParams {
  /** 登录密码(RSA加密传输) */
  password: string;
  /** 新邮箱 */
  email: string;
}

/**
 * 确认绑定参数
 */
export interface EmailBindConfirmParams {
  /** 邮箱验证码 */
  code: string;
}

/**
 * 解绑参数
 */
export interface EmailUnbindParams {
  /** 登录密码(RSA加密传输) */
  password: string;
  /** 邮箱验证码(发至当前绑定邮箱) */
  code: string;
}

/**
 * 发送解绑验证码参数
 */
export interface EmailUnbindSendCodeParams {
  /** 登录密码(RSA加密传输) */
  password: string;
}
