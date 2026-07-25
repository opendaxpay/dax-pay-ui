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
