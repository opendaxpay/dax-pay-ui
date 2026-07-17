import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付接口日志 API
 */
export const UnipayApiLogApi = {
  /**
   * 分页查询支付接口日志
   */
  page(params: any): Promise<Result<PageResult<UnipayApiLog>>> {
    return defHttp.get({ url: '/log/unipay/page', params });
  },
  /**
   * 获取支付接口日志详情
   */
  findById(id: string): Promise<Result<UnipayApiLog>> {
    return defHttp.get({ url: '/log/unipay/get', params: { id } });
  },
  /**
   * 清除指定天数之前的支付接口日志
   */
  deleteByDay(deleteDay: number): Promise<Result<void>> {
    return defHttp.post({ url: '/log/unipay/delete-by-day', params: { deleteDay } });
  },
};

/**
 * 支付接口日志
 */
export interface UnipayApiLog extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
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
  /** 请求参数 */
  reqParam?: string;
  /** 响应体 */
  resBody?: string;
  /** 操作时间 */
  operateTime?: string;
}
