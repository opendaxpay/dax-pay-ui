import type { PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 在线用户管理 API
 */
export const OnlineUserApi = {
  /**
   * 分页查询在线用户列表
   */
  page(params: OnlineUserQuery): Promise<PageResult<OnlineUser>> {
    return defHttp.get({ url: '/online/page', params });
  },
  /**
   * 强制用户下线
   */
  kickout(sessionId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/online/kickout', params: { sessionId } });
  },
  /**
   * 批量强制用户下线
   */
  kickoutBatch(sessionIds: string[]): Promise<Result<void>> {
    return defHttp.post({ url: '/online/kickout-batch', data: sessionIds });
  },
};

/**
 * 在线用户信息
 */
export interface OnlineUser {
  /** 会话ID */
  sessionId?: string;
  /** 用户ID */
  userId?: number;
  /** 用户名称 */
  username?: string;
  /** 账号 */
  account?: string;
  /** 终端编码 */
  clientCode?: string;
  /** 登录时间 */
  loginTime?: string;
}

/**
 * 在线用户查询参数
 */
export interface OnlineUserQuery {
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
}
