import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 操作日志 API
 */
export const OperateLogApi = {
  /**
   * 分页查询操作日志
   */
  page(params: any): Promise<Result<PageResult<OperateLog>>> {
    return defHttp.get({ url: '/log/operate/page', params });
  },
  /**
   * 获取操作日志详情
   */
  findById(id: string): Promise<Result<OperateLog>> {
    return defHttp.get({ url: '/log/operate/get', params: { id } });
  },
  /**
   * 清除指定天数之前的操作日志
   */
  deleteByDay(deleteDay: number): Promise<Result<void>> {
    return defHttp.post({ url: '/log/operate/delete-by-day', params: { deleteDay } });
  },
};

/**
 * 操作日志
 */
export interface OperateLog extends BaseEntity {
  /** 操作模块 */
  title?: string;
  /** 操作人员id */
  operateId?: string;
  /** 操作人员账号 */
  account?: string;
  /** 业务类型 */
  businessType?: string;
  /** 请求方法 */
  method?: string;
  /** 请求方式 */
  requestMethod?: string;
  /** 请求url */
  operateUrl?: string;
  /** 操作ip */
  operateIp?: string;
  /** 操作地点 */
  operateLocation?: string;
  /** 请求参数 */
  operateParam?: string;
  /** 返回参数 */
  operateReturn?: string;
  /** 是否成功 */
  success?: boolean;
  /** 错误提示 */
  errorMsg?: string;
  /** 操作时间 */
  operateTime?: string;
  /** 终端 */
  client?: string;
  /** 操作系统 */
  os?: string;
  /** 浏览器类型 */
  browser?: string;
}
