/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { createNonceRequestInterceptor } from '#/api/interceptors/nonce';
import { CLIENT_CODE } from '#/constants/client';
import { useMessage } from '#/hooks/useMessage';
import { useAuthStore } from '#/store';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

// 需二次验证的业务码(与后端 TwoFactorRequiredException.CODE 对齐)
// 密码已通过但仍需输动态码, 不是真正错误; 把响应体(含 preAuthToken)交给业务层
const TWO_FACTOR_REQUIRED_CODE = 40_101;

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token is invalid or expired.');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    if (preferences.app.loginExpiredMode === 'modal' && accessStore.isAccessChecked) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  // 防重放Nonce请求拦截器
  client.addRequestInterceptor(createNonceRequestInterceptor());

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = accessStore.accessToken;
      config.headers['Accept-Language'] = preferences.app.locale;
      config.headers['x-client-code'] = CLIENT_CODE;
      return config;
    },
  });

  // 处理返回的响应数据格式，返回后端响应体 Result<T>
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: (responseData) => responseData,
      successCode: 0,
    }),
  );

  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
    }),
  );

  // 40101: 密码已过但还要输动态码; 不弹失败, 把 body 交给业务层切二次验证页
  client.addResponseInterceptor({
    rejected: (error: any) => {
      const body = error?.response?.data;
      if (body?.code === TWO_FACTOR_REQUIRED_CODE) {
        return body;
      }
      return Promise.reject(error);
    },
  });

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const { message } = useMessage();
      // HTTP 错误(401等)响应体在 response.data; 业务错误(200但code非0)在顶层 data
      const body = error?.response?.data ?? error?.data ?? {};
      const errorMessage = body?.msg || body?.message || '';
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'body',
  // 与 baseRequestClient 对齐, 避免代理挂起时请求无限 pending 导致页面卡在 loading
  timeout: 30_000,
});

/**
 * 支持对象参数的HTTP请求类
 */
class DefHttp {
  private client: RequestClient;

  constructor(client: RequestClient) {
    this.client = client;
  }

  delete<T = any>(config: { [key: string]: any; headers?: any; params?: any; url: string }): Promise<T> {
    const { url, ...rest } = config;
    return this.client.delete<T>(url, rest);
  }

  get<T = any>(config: { [key: string]: any; headers?: any; params?: any; url: string }): Promise<T> {
    const { url, ...rest } = config;
    return this.client.get<T>(url, rest);
  }

  post<T = any>(config: { [key: string]: any; data?: any; headers?: any; params?: any; url: string }): Promise<T> {
    const { url, data, ...rest } = config;
    return this.client.post<T>(url, data, rest);
  }

  put<T = any>(config: { [key: string]: any; data?: any; headers?: any; params?: any; url: string }): Promise<T> {
    const { url, data, ...rest } = config;
    return this.client.put<T>(url, data, rest);
  }
}

export const defHttp = new DefHttp(requestClient);

export const baseRequestClient = new RequestClient({ baseURL: apiURL, timeout: 30_000 });
