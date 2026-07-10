import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 平台抖音开放平台 H5 应用认证配置 API
 *
 * 独立于「三方平台登录配置」中的抖音 OAuth 登录凭据。
 * 数据 AES-256-GCM 加密存储, 敏感字段(clientSecret)脱敏返回。
 */
export const PlatformDouyinH5AuthConfigApi = {
  /**
   * 获取抖音 H5 应用认证配置(敏感字段脱敏)
   */
  get(): Promise<Result<PlatformDouyinH5AuthConfig>> {
    return defHttp.get({ url: '/platform/config/douyin-h5-auth/get' });
  },

  /**
   * 更新抖音 H5 应用认证配置
   * 敏感字段(clientSecret)未修改时前端不传(undefined), 后端 IGNORE 策略跳过更新。
   */
  update(data: PlatformDouyinH5AuthConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/douyin-h5-auth/update', data });
  },
};

/**
 * 平台抖音开放平台 H5 应用认证配置
 */
export interface PlatformDouyinH5AuthConfig {
  /** 抖音开放平台 Client Key */
  clientKey?: string;
  /** 抖音开放平台 Client Secret(脱敏返回, 编辑时未修改不传) */
  clientSecret?: string;
}
