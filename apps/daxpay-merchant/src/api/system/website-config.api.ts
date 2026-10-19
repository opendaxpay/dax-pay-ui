import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 站点配置 API（商户端只读）
 *
 * update 端点挂运营端 system:platform-config 菜单, 商户端角色绑不上恒 403 且无管理页面, 已删除死代码。
 */
export const WebsiteConfigApi = {
  /**
   * 获取站点配置(免登录, 管理端与登录页共用)
   */
  get(): Promise<Result<WebsiteConfig>> {
    return defHttp.get({ url: '/platform/config/website/get' });
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
  /** 配置内容哈希(只读, 供客户端缓存比对) */
  contentHash?: string;
}
