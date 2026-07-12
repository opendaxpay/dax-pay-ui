import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 安全配置 API
 */
export const SecurityApi = {
  /**
   * 获取密码策略配置
   */
  getPasswordPolicyConfig(): Promise<Result<PasswordPolicyConfig>> {
    return defHttp.get({ url: '/platform/config/security/password-policy/get' });
  },
  /**
   * 获取密码策略校验配置（供前端校验使用，无需登录）
   */
  getPasswordPolicyValidateConfig(): Promise<Result<PasswordPolicyValidateConfig>> {
    return defHttp.get({ url: '/platform/config/security/password-policy/validate-config' });
  },
  /**
   * 更新密码策略配置
   */
  updatePasswordPolicyConfig(data: PasswordPolicyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/security/password-policy/update', data });
  },
  /**
   * 获取登录安全配置
   */
  getLoginSecurityConfig(): Promise<Result<LoginSecurityConfig>> {
    return defHttp.get({ url: '/platform/config/security/login/get' });
  },
  /**
   * 更新登录安全配置
   */
  updateLoginSecurityConfig(data: LoginSecurityConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/security/login/update', data });
  },
  /**
   * 获取会话管理配置
   */
  getSessionManagementConfig(): Promise<Result<SessionManagementConfig>> {
    return defHttp.get({ url: '/platform/config/security/session/get' });
  },
  /**
   * 更新会话管理配置
   */
  updateSessionManagementConfig(data: SessionManagementConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/security/session/update', data });
  },
  /**
   * 获取双因素认证配置
   */
  getTwoFactorAuthConfig(): Promise<Result<TwoFactorAuthConfig>> {
    return defHttp.get({ url: '/platform/config/security/two-factor-auth/get' });
  },
  /**
   * 更新双因素认证配置
   */
  updateTwoFactorAuthConfig(data: TwoFactorAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/security/two-factor-auth/update', data });
  },
};

/**
 * 密码策略配置
 */
export interface PasswordPolicyConfig {
  /** 是否启用 */
  enabled?: boolean;
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 是否要求大写字母 */
  requireUppercase?: boolean;
  /** 是否要求小写字母 */
  requireLowercase?: boolean;
  /** 是否要求数字 */
  requireDigit?: boolean;
  /** 是否要求特殊字符 */
  requireSpecialChar?: boolean;
  /** 特殊字符集合 */
  specialChars?: string;
  /** 密码轮换天数 */
  rotationDays?: number;
  /** 历史密码检查数量 */
  historyCount?: number;
}

/**
 * 密码策略校验配置（供前端校验使用）
 */
export type PasswordPolicyValidateConfig = PasswordPolicyConfig;

/**
 * 登录安全配置
 */
export interface LoginSecurityConfig {
  /** 是否启用锁定 */
  lockoutEnabled?: boolean;
  /** 最大失败尝试次数 */
  maxFailedAttempts?: number;
  /** 锁定时长（分钟） */
  lockoutDurationMinutes?: number;
  /** 失败重置时间（分钟） */
  failureResetMinutes?: number;
  /** 是否启用验证码 */
  captchaEnabled?: boolean;
  /** 触发验证码的尝试次数 */
  captchaTriggerAttempts?: number;
}

/**
 * 会话管理配置
 */
export interface SessionManagementConfig {
  /** 是否启用 */
  enabled?: boolean;
  /** 最大在线时长（小时） */
  maxOnlineHours?: number;
  /** 最大活跃时长（小时），0表示不限制 */
  activeTimeoutHours?: number;
  /** 最大并发会话数 */
  maxConcurrentSessions?: number;
  /** 并发策略 */
  concurrentStrategy?: string;
  /** 并发计数范围 GLOBAL=全局共享 / PER_DEVICE=按终端独立 */
  concurrentScope?: string;
}

/**
 * 双因素认证配置
 */
export interface TwoFactorAuthConfig {
  /** 是否启用 */
  enabled?: boolean;
  /** 发行者 */
  issuer?: string;
  /** 备用码数量 */
  backupCodesCount?: number;
}
