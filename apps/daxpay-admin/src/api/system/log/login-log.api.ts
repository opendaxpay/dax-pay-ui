import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 登录日志 API
 */
export const LoginLogApi = {
  /**
   * 分页查询登录日志
   */
  page(params: any): Promise<Result<PageResult<LoginLog>>> {
    return defHttp.get({ url: '/log/login/page', params });
  },
  /**
   * 获取登录日志详情
   */
  findById(id: string): Promise<Result<LoginLog>> {
    return defHttp.get({ url: '/log/login/get', params: { id } });
  },
  /**
   * 清除指定天数之前的登录日志
   */
  deleteByDay(deleteDay: number): Promise<Result<void>> {
    return defHttp.post({ url: '/log/login/delete-by-day', params: { deleteDay } });
  },
};

/**
 * 登录日志
 */
export interface LoginLog extends BaseEntity {
  /** 用户id */
  userId?: string;
  /** 用户账号 */
  account?: string;
  /** 登录成功状态 */
  login?: boolean;
  /** 终端 */
  client?: string;
  /** 登录方式 */
  loginType?: string;
  /** 登录IP地址 */
  ip?: string;
  /** 登录地点 */
  loginLocation?: string;
  /** 操作系统 */
  os?: string;
  /** 浏览器类型 */
  browser?: string;
  /** 提示消息 */
  msg?: string;
  /** 访问时间 */
  loginTime?: string;
}
