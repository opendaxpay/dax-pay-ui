import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

import type { PasswordPolicyValidateConfig } from '@daxpay/ui-biz/types/password-policy';

/**
 * 安全配置 API（商户端只读）
 *
 * 安全配置管理端点(密码策略/登录/会话/双因素/防重放的 get+update)挂运营端 system:security-config 菜单,
 * 商户端角色绑不上恒 403 且无管理页面, 已删除死代码; 商户端改密页只走免登录的校验配置端点。
 */
export const SecurityApi = {
  /**
   * 获取密码策略校验配置（供前端校验使用，无需登录）
   */
  getPasswordPolicyValidateConfig(): Promise<Result<PasswordPolicyValidateConfig>> {
    return defHttp.get({ url: '/platform/config/security/password-policy/validate-config' });
  },
};

export type { PasswordPolicyValidateConfig };
