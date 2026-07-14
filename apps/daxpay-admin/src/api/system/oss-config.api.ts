import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * OSS配置 API
 */
export const OssConfigApi = {
  /**
   * 获取OSS配置
   */
  get(): Promise<Result<OssConfig>> {
    return defHttp.get({ url: '/platform/config/oss/get' });
  },
  /**
   * 更新OSS配置
   */
  update(data: OssConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/oss/update', data });
  },
  /**
   * 检查OSS连通性
   */
  check(data?: OssConfig): Promise<Result<ConnectivityCheckResult>> {
    return defHttp.post({ url: '/platform/config/oss/check', data });
  },
};

/**
 * OSS配置
 */
export interface OssConfig {
  /** 服务端点 */
  endpoint?: string;
  /** 存储区域 */
  region?: string;
  /** 公开存储桶 */
  publicBucket?: string;
  /** 私有存储桶 */
  privateBucket?: string;
  /** 公开访问域名 */
  publicBaseUrl?: string;
  /** 私有访问域名 */
  privateBaseUrl?: string;
  /** 访问密钥 */
  accessKey?: string;
  /** 私有密钥 */
  secretKey?: string;
  /** 路径样式访问 */
  pathStyleAccess?: boolean;
  /** 上传预签名URL有效期（分钟） */
  uploadExpireMinutes?: number;
  /** 下载或查看预签名URL有效期（小时） */
  downloadExpireHours?: number;
  /** 基础存储路径 */
  basePath?: string;
}

/**
 * 连通性检查结果
 */
export interface ConnectivityCheckResult {
  success?: boolean;
  message?: string;
  statusCode?: number;
  latencyMs?: number;
}
