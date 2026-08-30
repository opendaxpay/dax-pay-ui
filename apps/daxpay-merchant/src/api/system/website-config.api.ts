import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 站点配置 API
 */
export const WebsiteConfigApi = {
  /**
   * 获取站点配置(免登录, 管理端与登录页共用)
   */
  get(): Promise<Result<WebsiteConfig>> {
    return defHttp.get({ url: '/platform/config/website/get' });
  },
  /**
   * 更新站点配置
   */
  update(data: WebsiteConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/website/update', data });
  },
};

/**
 * 平台站点显示内容配置
 */
export interface WebsiteConfig {
  /** 系统名称 */
  systemName?: string;
  /** 公司全称 */
  companyName?: string;
  /** 公司电话 */
  companyPhone?: string;
  /** 公司邮箱 */
  companyEmail?: string;
  /** 客服/商务微信号 */
  companyWechat?: string;
  /** 系统亮色 logo */
  logo?: string;
  /** 系统暗色 logo, 不传则复用亮色 */
  logoDark?: string;
  /** 工信部 ICP 备案信息 */
  icpInfo?: string;
  /** 工信部 ICP 链接地址 */
  icpLink?: string;
  /** 公网安备案信息 */
  mpsInfo?: string;
  /** 公网安备案链接地址 */
  mpsLink?: string;
  /** 中国支付清算协会备案信息 */
  pcacInfo?: string;
  /** 中国支付清算协会备案链接地址 */
  pcacLink?: string;
  /** 电信增值业务许可信息 */
  icpPlusInfo?: string;
  /** 电信增值业务许可链接地址 */
  icpPlusLink?: string;
  /** 版权信息 */
  copyright?: string;
  /** 找回密码入口是否可用(只读, 按邮件发件箱配置是否就绪计算, 未配置时登录页隐藏入口) */
  forgetPasswordEnabled?: boolean;
  /** 配置内容哈希(只读, 供客户端缓存比对) */
  contentHash?: string;
}
