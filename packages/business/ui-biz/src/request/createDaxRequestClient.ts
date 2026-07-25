import type { RequestClientOptions } from '@vben/request';

import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { CLIENT_CODE } from '../constants/client';
import { useMessage } from '../hooks/useMessage';
import { createNonceRequestInterceptor } from './nonce';

// 需二次验证的业务码(与后端 TwoFactorRequiredException.CODE 对齐)
// 密码已通过但仍需输动态码, 不是真正错误; 把响应体(含 preAuthToken)交给业务层
const TWO_FACTOR_REQUIRED_CODE = 40_101;

/** DaxPay 请求客户端创建选项 */
export interface DaxRequestClientOptions {
  /** 接口基地址 */
  baseURL: string;
  /**
   * access token 失效时的重新认证逻辑
   *
   * 由各 app 注入（通常调用 useAuthStore().logout），以解耦端特定的 auth store.
   */
  doReAuthenticate: () => Promise<void>;
  /** 透传给主 RequestClient 的额外选项 */
  clientOptions?: RequestClientOptions;
}

/**
 * 支持对象参数的 HTTP 请求类
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

/**
 * 创建 DaxPay 统一请求客户端
 *
 * 封装 nonce 防重放、token/语言/端身份头注入、统一响应解析、二次验证透传、错误提示等拦截器.
 * - CLIENT_CODE 由各 app `.env` 的 `VITE_APP_CLIENT_CODE` 构建期注入
 * - doReAuthenticate 由各 app 注入（通常调用 useAuthStore().logout）
 *
 * 返回三元组：requestClient（业务主客户端）、baseRequestClient（无拦截器，nonce 内部用）、defHttp（对象参数封装）.
 */
export function createDaxRequestClient(options: DaxRequestClientOptions): {
  baseRequestClient: RequestClient;
  defHttp: DefHttp;
  requestClient: RequestClient;
} {
  const { baseURL, doReAuthenticate, clientOptions } = options;

  // baseRequestClient: 无业务拦截器, 供 nonce 拦截器调 /nonce/generate 避免循环
  const baseRequestClient = new RequestClient({ baseURL, timeout: 30_000 });

  const requestClient = new RequestClient({
    ...clientOptions,
    baseURL,
    responseReturn: 'body',
    // 与 baseRequestClient 对齐, 避免代理挂起时请求无限 pending 导致页面卡在 loading
    timeout: 30_000,
  });

  // 防重放 Nonce 请求拦截器
  requestClient.addRequestInterceptor(createNonceRequestInterceptor(baseRequestClient));

  // 请求头处理
  requestClient.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      const token = accessStore.accessToken;

      // 与后端 sa-token.token-name=Accesstoken 对齐; Authorization 保留兼容
      config.headers.Accesstoken = token;
      config.headers.Authorization = token;
      config.headers['Accept-Language'] = preferences.app.locale;
      config.headers['x-client-code'] = CLIENT_CODE;
      return config;
    },
  });

  // 处理返回的响应数据格式，返回后端响应体 Result<T>
  requestClient.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: (responseData) => responseData,
      successCode: 0,
    }),
  );

  requestClient.addResponseInterceptor(
    authenticateResponseInterceptor({
      client: requestClient,
      doReAuthenticate,
    }),
  );

  // 40101: 密码已过但还要输动态码; 不弹失败, 把 body 交给业务层切二次验证页
  requestClient.addResponseInterceptor({
    rejected: (error: any) => {
      const body = error?.response?.data;
      if (body?.code === TWO_FACTOR_REQUIRED_CODE) {
        return body;
      }
      return Promise.reject(error);
    },
  });

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  requestClient.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 静默错误(请求 config 中设置 silentError=true), 不弹全局 toast, 由业务自行处理
      if (error?.config?.silentError) {
        return;
      }
      const { message } = useMessage();
      // HTTP 错误(401等)响应体在 response.data; 业务错误(200但code非0)在顶层 data
      const body = error?.response?.data ?? error?.data ?? {};
      const errorMessage = body?.msg || body?.message || '';
      message.error(errorMessage || msg);
    }),
  );

  const defHttp = new DefHttp(requestClient);

  return { baseRequestClient, defHttp, requestClient };
}
