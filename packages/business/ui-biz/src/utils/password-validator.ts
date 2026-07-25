import type { PasswordPolicyValidateConfig } from '../types/password-policy';

import { $t } from '@vben/locales';

/**
 * 密码条件项
 */
export interface PasswordCondition {
  key: string;
  label: string;
  satisfied: boolean;
}

/**
 * 获取密码条件列表（用于显示状态）
 */
export function getPasswordConditions(password: string, config: PasswordPolicyValidateConfig): PasswordCondition[] {
  const conditions: PasswordCondition[] = [];

  if (!config.enabled) {
    return conditions;
  }

  // 长度条件
  if (config.minLength && config.maxLength) {
    conditions.push({
      key: 'length',
      label: $t('iam.user.passwordPolicy.hintLength', { min: config.minLength, max: config.maxLength }),
      satisfied: password.length >= config.minLength && password.length <= config.maxLength,
    });
  }

  // 大写字母
  if (config.requireUppercase) {
    conditions.push({
      key: 'uppercase',
      label: $t('iam.user.passwordPolicy.hintUppercase'),
      satisfied: /[A-Z]/.test(password),
    });
  }

  // 小写字母
  if (config.requireLowercase) {
    conditions.push({
      key: 'lowercase',
      label: $t('iam.user.passwordPolicy.hintLowercase'),
      satisfied: /[a-z]/.test(password),
    });
  }

  // 数字
  if (config.requireDigit) {
    conditions.push({
      key: 'digit',
      label: $t('iam.user.passwordPolicy.hintDigit'),
      satisfied: /\d/.test(password),
    });
  }

  // 特殊字符
  if (config.requireSpecialChar && config.specialChars) {
    conditions.push({
      key: 'specialChar',
      label: $t('iam.user.passwordPolicy.hintSpecialChar', { chars: config.specialChars }),
      satisfied: new RegExp(`[${escapeRegExp(config.specialChars)}]`).test(password),
    });
  }

  return conditions;
}

/**
 * 计算密码强度（根据配置）
 * 强度 = 满足的条件数 / 总条件数 * 5
 */
export function calculatePasswordStrength(password: string, config: PasswordPolicyValidateConfig): number {
  if (!password) return 0;

  const conditions = getPasswordConditions(password, config);
  const satisfiedCount = conditions.filter((c) => c.satisfied).length;
  const totalCount = conditions.length;

  if (totalCount === 0) return 0;

  // 按比例计算强度（1-5）
  return Math.ceil((satisfiedCount / totalCount) * 5);
}

/**
 * 生成简化的表单校验规则
 */
export function generatePasswordRules(config: PasswordPolicyValidateConfig) {
  return [
    { required: true, message: $t('iam.user.validation.passwordRequired') },
    {
      validator: (_rule: any, value: string) => {
        if (!value) return Promise.resolve();
        // 密码不允许中文
        if (/[\u4E00-\u9FA5]/.test(value)) {
          return Promise.reject($t('iam.user.validation.passwordNoChinese'));
        }
        if (!config.enabled) return Promise.resolve();
        const conditions = getPasswordConditions(value, config);
        const allSatisfied = conditions.every((c) => c.satisfied);
        if (!allSatisfied) {
          return Promise.reject($t('iam.user.passwordPolicy.notMeetRequirements'));
        }
        return Promise.resolve();
      },
      trigger: 'change',
    },
  ];
}

/**
 * 账号验证规则（只允许字母、数字、下划线、中划线）
 */
export function generateAccountRules() {
  return [
    { required: true, message: $t('common.pleaseInput') },
    { min: 6, max: 20, message: $t('iam.user.validation.accountLength') },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: $t('iam.user.validation.accountFormat') },
  ];
}

/**
 * 计算密码内在强度（固定规则，不依赖后台配置）
 * 用于强度条的显示
 */
export function calculateIntrinsicStrength(password: string): number {
  if (!password) return 0;

  let strength = 0;

  // 长度 >= 8
  if (password.length >= 8) strength++;
  // 包含小写字母
  if (/[a-z]/.test(password)) strength++;
  // 包含大写字母
  if (/[A-Z]/.test(password)) strength++;
  // 包含数字
  if (/\d/.test(password)) strength++;
  // 包含特殊字符
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

  return strength;
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}
