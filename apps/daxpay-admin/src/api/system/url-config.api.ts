import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 端点配置 API
 */
export const UrlConfigApi = {
  /**
   * 获取端点配置
   */
  get(): Promise<Result<UrlConfig>> {
    return defHttp.get({ url: '/platform/config/url/get' });
  },
  /**
   * 更新端点配置
   */
  update(data: UrlConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/url/update', data });
  },
};

/**
 * 平台端点配置
 */
export interface UrlConfig {
  /** 管理端访问地址 */
  adminBaseUrl?: string;
  /** 商户端访问地址 */
  merchantBaseUrl?: string;
  /** 支付网关前端地址 */
  paymentGatewayBaseUrl?: string;
  /** 后端 API 地址 */
  backendBaseUrl?: string;
}
