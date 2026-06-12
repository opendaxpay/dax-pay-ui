import type { Result } from '#/types/web';

import { baseRequestClient } from '#/api/request';

/**
 * Nonce生成结果
 */
export interface NonceResult {
  /** nonce值 */
  nonce: string;
  /** 服务器时间戳（毫秒） */
  timestamp: number;
}

/**
 * 防重放Nonce API
 */
export const NonceApi = {
  /**
   * 获取Nonce值
   * 使用 baseRequestClient 避免触发主请求拦截器的 nonce 逻辑（防止循环调用）
   */
  async generate(): Promise<Result<NonceResult>> {
    const response = await baseRequestClient.instance.get('/nonce/generate');
    return response.data;
  },
};
