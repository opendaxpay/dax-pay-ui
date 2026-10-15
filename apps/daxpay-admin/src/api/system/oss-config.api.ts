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
 * 连通性检查步骤结果
 */
export interface CheckStep {
  /** 步骤标识: connect-连接与桶存在 / write-写入 / read-读取 / publicAccess-公开访问 */
  step?: string;
  /** 步骤状态: success-通过 / failed-失败 / warning-警告 / skipped-跳过 */
  status?: 'failed' | 'skipped' | 'success' | 'warning';
  /** 失败或警告说明 */
  message?: string;
}

/**
 * 存储桶连通性检查明细
 */
export interface BucketCheckDetail {
  /** 桶名称 */
  bucketName?: string;
  /** 该桶读写闭环是否通过 */
  success?: boolean;
  /** 失败概述 */
  message?: string;
  /** 分步检查结果 */
  steps?: CheckStep[];
}

/**
 * 连通性检查结果
 */
export interface ConnectivityCheckResult {
  success?: boolean;
  message?: string;
  statusCode?: number;
  latencyMs?: number;
  /** 警告信息（检查通过但存在隐患时有值，如公开访问域名不可达） */
  warning?: string;
  /** 公开桶检查明细（两桶各自独立检查，一桶失败不影响另一桶明细呈现） */
  publicBucketDetail?: BucketCheckDetail;
  /** 私有桶检查明细 */
  privateBucketDetail?: BucketCheckDetail;
}
