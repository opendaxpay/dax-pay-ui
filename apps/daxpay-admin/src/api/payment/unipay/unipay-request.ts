/**
 * unipay 轻量 HTTP 客户端
 *
 * 用于管理端「交易调试」等场景模拟商户直调统一支付接口。
 * 与 defHttp/requestClient 隔离:
 * - 不注入 Accesstoken / x-client-code / nonce
 * - 不挂登录失效拦截器(避免业务错误误踢登录)
 * - 业务 code !== 0 时仍原样返回 body, 由页面展示完整 DaxResult
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { RequestClient } from '@vben/request';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

/** unipay 通用响应(与后端 DaxResult 对齐) */
export interface DaxResult<T = unknown> {
  code: number;
  msg?: string;
  data?: T;
  sign?: string;
  resTime?: string;
  traceId?: string;
}

function createUnipayClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
    // 通道调用可能较慢
    timeout: 60_000,
    responseReturn: 'body',
  });

  // 始终返回响应体; 业务失败(code!=0)不 throw, 交给调用方展示
  client.addResponseInterceptor({
    fulfilled: (response) => response.data,
  });

  return client;
}

const unipayClient = createUnipayClient(apiURL);

/**
 * POST unipay 接口, 返回完整 DaxResult(含业务失败)
 */
export async function unipayPost<T = unknown>(url: string, data?: unknown): Promise<DaxResult<T>> {
  // RequestClient 在 HTTP 非 2xx 时 throw response.data; 尽量当成 DaxResult 透出
  try {
    return await unipayClient.post<DaxResult<T>>(url, data);
  } catch (error: unknown) {
    // 后端部分异常可能以非 2xx + body 形式返回
    if (error && typeof error === 'object' && 'code' in error) {
      return error as DaxResult<T>;
    }
    throw error;
  }
}
