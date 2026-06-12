import type { RequestInterceptorConfig } from '@vben/request';

import { NonceApi } from '#/api/core/nonce.api';

/**
 * 创建 Nonce 防重放请求拦截器
 *
 * 工作流程：
 * 1. 请求拦截器检测到 config.requireNonce === true
 * 2. 调用 GET /nonce/generate 获取 nonce + timestamp
 * 3. 将 X-Nonce / X-Timestamp 注入请求 Header
 * 4. 请求正常发出（无需重试）
 *
 * 使用方式：在 API 定义中给需要防重放的请求添加 requireNonce: true
 * 例：requestClient.post('/token/login', formData, { requireNonce: true })
 */
export function createNonceRequestInterceptor(): RequestInterceptorConfig {
  return {
    fulfilled: async (config) => {
      // 检测是否需要 nonce
      if (config.requireNonce) {
        // 调用 nonce 接口获取 nonce 和服务器时间戳
        const { data: nonceData } = await NonceApi.generate();

        if (nonceData?.nonce && nonceData?.timestamp) {
          // 将 nonce 和 timestamp 注入请求 Header
          config.headers['x-nonce'] = nonceData.nonce;
          config.headers['x-timestamp'] = String(nonceData.timestamp);
        }
      }

      return config;
    },
  };
}

/**
 * 扩展 AxiosRequestConfig，添加 requireNonce 选项
 */
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    /** 是否需要防重放 nonce 验证 */
    requireNonce?: boolean;
  }
}
