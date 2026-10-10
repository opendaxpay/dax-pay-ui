import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 统一支付接口调用日志 API(商户端只读, 强制按当前商户过滤)
 */
export const UnipayApiLogApi = {
  /**
   * 分页查询支付接口调用日志
   */
  page(params: UnipayApiLogQuery): Promise<Result<PageResult<UnipayApiLog>>> {
    return defHttp.get({ url: '/mch/log/unipay/page', params });
  },
  /**
   * 获取支付接口调用日志详情
   */
  findById(id: string): Promise<Result<UnipayApiLog>> {
    return defHttp.get({ url: '/mch/log/unipay/get', params: { id } });
  },
};

/**
 * 支付接口调用日志(商户视角, 无商户字段)
 */
export interface UnipayApiLog extends BaseEntity {
  /** 请求ID */
  reqId?: string;
  /** 接口路径 */
  apiPath?: string;
  /** 接口标题 */
  apiTitle?: string;
  /** HTTP 方法 */
  requestMethod?: string;
  /** 商户声明客户端 IP */
  clientIp?: string;
  /** 真实接入 IP */
  requestIp?: string;
  /** 接入 IP 归属地 */
  requestLocation?: string;
  /** 是否成功 */
  success?: boolean;
  /** 业务错误码 */
  errorCode?: number;
  /** 错误信息 */
  errorMsg?: string;
  /** 耗时毫秒 */
  durationMs?: number;
  /** 链路追踪 ID */
  traceId?: string;
  /** 请求参数(写入时已脱敏) */
  reqParam?: string;
  /** 响应体(写入时已脱敏) */
  resBody?: string;
  /** 操作时间 */
  operateTime?: string;
}

export interface UnipayApiLogQuery {
  /** 当前页 */
  current?: number;
  /** 每页条数 */
  size?: number;
  /** 接口路径 */
  apiPath?: string;
  /** 请求ID */
  reqId?: string;
  /** 链路ID */
  traceId?: string;
  /** 是否成功 */
  success?: boolean;
}
