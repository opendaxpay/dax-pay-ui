import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 服务商登录安全配置 API
 */
export const IsvLoginSecurityApi = {
  /**
   * 根据服务商号查询登录安全配置
   */
  findByIsvNo(isvNo: string): Promise<Result<IsvLoginSecurityConfig>> {
    return defHttp.get({ url: '/admin/isv/security/login-security/get-by-isv-no', params: { isvNo } });
  },
  /**
   * 更新服务商登录安全配置
   */
  update(data: IsvLoginSecurityConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/security/login-security/update', data });
  },
};

/**
 * 服务商登录安全配置
 */
export interface IsvLoginSecurityConfig {
  /** 主键 */
  id?: string;
  /** 服务商号 */
  isvNo?: string;
  /** 是否使用平台配置 */
  usePlatform?: boolean;
  /** 是否启用登录锁定 */
  lockoutEnabled?: boolean;
  /** 最大失败次数 */
  maxFailedAttempts?: number;
  /** 锁定时长（分钟） */
  lockoutDurationMinutes?: number;
  /** 失败重置时长（分钟） */
  failureResetMinutes?: number;
  /** 是否启用验证码 */
  captchaEnabled?: boolean;
  /** 触发验证码的尝试次数 */
  captchaTriggerAttempts?: number;
}

/**
 * 服务商登录安全配置参数
 */
export interface IsvLoginSecurityConfigParam {
  /** 服务商号 */
  isvNo?: string;
  /** 是否使用平台配置 */
  usePlatform?: boolean;
  /** 是否启用登录锁定 */
  lockoutEnabled?: boolean;
  /** 最大失败次数 */
  maxFailedAttempts?: number;
  /** 锁定时长（分钟） */
  lockoutDurationMinutes?: number;
  /** 失败重置时长（分钟） */
  failureResetMinutes?: number;
  /** 是否启用验证码 */
  captchaEnabled?: boolean;
  /** 触发验证码的尝试次数 */
  captchaTriggerAttempts?: number;
}
