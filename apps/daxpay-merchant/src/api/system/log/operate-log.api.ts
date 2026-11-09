import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 操作日志 API(商户端只读, 强制按当前商户过滤)
 */
export const OperateLogApi = {
  /**
   * 分页查询操作日志
   */
  page(params: OperateLogQuery): Promise<Result<PageResult<OperateLog>>> {
    return defHttp.get({ url: '/mch/log/operate/page', params });
  },
  /**
   * 获取操作日志详情
   */
  findById(id: string): Promise<Result<OperateLog>> {
    return defHttp.get({ url: '/mch/log/operate/get', params: { id } });
  },
};

/**
 * 操作日志(商户视角, 无方法名称字段)
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

export interface OperateLogQuery {
  /** 当前页 */
  current?: number;
  /** 每页条数 */
  size?: number;
  /** 操作模块 */
  title?: string;
  /** 操作账号 */
  account?: string;
  /** 是否成功 */
  success?: boolean;
}
