import type { PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 登录锁定监控 API(系统监控-锁定用户)
 */
export const LoginLockApi = {
  /**
   * 分页查询锁定/计数中的用户
   */
  page(params: LoginLockQuery): Promise<Result<LoginLockPageResult>> {
    return defHttp.get({ url: '/login-lock/page', params });
  },
  /**
   * 解锁用户登录锁定(清除锁定时间与失败计数)
   */
  unlock(userId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/login-lock/unlock', params: { userId } });
  },
};

/**
 * 登录锁定信息
 */
export interface LoginLock {
  /** 用户ID */
  id?: string;
  /** 用户名称 */
  username?: string;
  /** 账号 */
  account?: string;
  /** 终端编码 */
  clientCode?: string;
  /** 密码错误次数 */
  passwordErrorCount?: number;
  /** 锁定结束时间 */
  lockTime?: string;
  /** 剩余锁定分钟数(仅锁定中有值) */
  remainingMinutes?: number;
  /** 上次登录失败时间 */
  lastFailureTime?: string;
  /** 锁定状态: locked-锁定中 expired-已到期 counting-计数中 */
  status?: string;
}

/**
 * 登录锁定分页结果(附带锁定功能开关标志)
 */
export interface LoginLockPageResult {
  /** 登录锁定功能是否启用 */
  lockoutEnabled?: boolean;
  /** 分页数据 */
  page?: PageResult<LoginLock>;
}

/**
 * 登录锁定查询参数
 */
export interface LoginLockQuery {
  /** 当前页 */
  current: number;
  /** 每页大小 */
  size: number;
  /** 用户名称 */
  username?: string;
  /** 账号 */
  account?: string;
  /** 终端编码 */
  clientCode?: string;
  /** 锁定状态 */
  status?: string;
}
