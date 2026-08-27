import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 平台邮件发件箱配置 API
 */
export const MailConfigApi = {
  /**
   * 获取邮件发件箱配置
   */
  get(): Promise<Result<MailConfig>> {
    return defHttp.get({ url: '/platform/config/mail/get' });
  },
  /**
   * 更新邮件发件箱配置
   */
  update(data: MailConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/mail/update', data });
  },
};

/**
 * 邮件发件箱配置
 */
export interface MailConfig {
  /** SMTP服务器地址 */
  host?: string;
  /** SMTP服务器端口 */
  port?: number;
  /** 发件邮箱账号 */
  username?: string;
  /** SMTP授权码 */
  password?: string;
  /** 发件地址(为空时使用username) */
  from?: string;
  /** 发件人显示名 */
  nickname?: string;
  /** 传输加密方式(none/starttls/ssl) */
  securityType?: string;
  /** 超时时间(秒) */
  timeout?: number;
  /** 通道总开关 */
  enabled?: boolean;
}
