import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 平台微信公众号 H5 认证配置 API
 *
 * 用于微信公众号网页授权登录(iam 模块)。
 * 数据 AES-256-GCM 加密存储, 敏感字段(appSecret)脱敏返回。
 */
export const PlatformWechatMpAuthConfigApi = {
  /**
   * 获取微信公众号认证配置(敏感字段脱敏)
   */
  get(): Promise<Result<PlatformWechatMpAuthConfig>> {
    return defHttp.get({ url: '/platform/config/wechat-mp-auth/get' });
  },

  /**
   * 更新微信公众号认证配置
   * 敏感字段(appSecret)未修改时前端不传(undefined), 后端 IGNORE 策略跳过更新。
   */
  update(data: PlatformWechatMpAuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/wechat-mp-auth/update', data });
  },
};

/**
 * 平台微信公众号 H5 认证配置
 */
export interface PlatformWechatMpAuthConfig {
  /** 微信公众号 AppId */
  appId?: string;
  /** 微信公众号 AppSecret(脱敏返回, 编辑时未修改不传) */
  appSecret?: string;
}
