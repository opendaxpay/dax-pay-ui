import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 服务商密码策略配置 API
 */
export const IsvPasswordPolicyApi = {
  /**
   * 根据服务商号查询密码策略配置
   */
  findByIsvNo(isvNo: string): Promise<Result<IsvPasswordPolicyConfig>> {
    return defHttp.get({ url: '/admin/isv/security/password-policy/get-by-isv-no', params: { isvNo } });
  },
  /**
   * 更新服务商密码策略配置
   */
  update(data: IsvPasswordPolicyConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/security/password-policy/update', data });
  },
};

/**
 * 服务商密码策略配置
 */
export interface IsvPasswordPolicyConfig {
  /** 主键 */
  id?: string;
  /** 服务商号 */
  isvNo?: string;
  /** 是否使用平台配置 */
  usePlatform?: boolean;
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
  /** 特殊字符集 */
  specialChars?: string;
  /** 轮换周期（天） */
  rotationDays?: number;
  /** 历史记录数 */
  historyCount?: number;
}

/**
 * 服务商密码策略配置参数
 */
export interface IsvPasswordPolicyConfigParam {
  /** 服务商号 */
  isvNo?: string;
  /** 是否使用平台配置 */
  usePlatform?: boolean;
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
  /** 特殊字符集 */
  specialChars?: string;
  /** 轮换周期（天） */
  rotationDays?: number;
  /** 历史记录数 */
  historyCount?: number;
}
