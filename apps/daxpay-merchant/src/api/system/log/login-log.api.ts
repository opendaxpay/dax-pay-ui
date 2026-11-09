import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 登录日志 API(商户端只读, 强制按当前商户过滤)
 */
export const LoginLogApi = {
  /**
   * 分页查询登录日志
   */
  page(params: LoginLogQuery): Promise<Result<PageResult<LoginLog>>> {
    return defHttp.get({ url: '/mch/log/login/page', params });
  },
  /**
   * 获取登录日志详情
   */
  findById(id: string): Promise<Result<LoginLog>> {
    return defHttp.get({ url: '/mch/log/login/get', params: { id } });
  },
};

/**
 * 登录日志(商户视角, 无用户ID字段)
 */
export interface LoginLog extends BaseEntity {
  /** 用户账号 */
  account?: string;
  /** 登录成功状态 */
  login?: boolean;
  /** 终端 */
  client?: string;
  /** 终端形态(web=PC Web端/app=移动端/elf=PC收款精灵) */
  terminal?: string;
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

export interface LoginLogQuery {
  /** 当前页 */
  current?: number;
  /** 每页条数 */
  size?: number;
  /** 用户账号 */
  account?: string;
  /** 是否登录成功 */
  login?: boolean;
}
