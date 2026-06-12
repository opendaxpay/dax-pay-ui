import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 服务商会话管理配置 API
 */
export const IsvSessionConfigApi = {
  /**
   * 根据服务商号查询会话管理配置
   */
  findByIsvNo(isvNo: string): Promise<Result<IsvSessionConfig>> {
    return defHttp.get({ url: '/admin/isv/security/session/get-by-isv-no', params: { isvNo } });
  },
  /**
   * 更新服务商会话管理配置
   */
  update(data: IsvSessionConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/isv/security/session/update', data });
  },
};

/**
 * 服务商会话管理配置
 */
export interface IsvSessionConfig {
  /** 主键 */
  id?: string;
  /** 服务商号 */
  isvNo?: string;
  /** 是否使用平台配置 */
  usePlatform?: boolean;
  /** 是否启用 */
  enabled?: boolean;
  /** 最大在线时长（小时） */
  maxOnlineHours?: number;
  /** 最大并发会话数 */
  maxConcurrentSessions?: number;
  /** 并发策略 */
  concurrentStrategy?: string;
}

/**
 * 服务商会话管理配置参数
 */
export interface IsvSessionConfigParam {
  /** 服务商号 */
  isvNo?: string;
  /** 是否使用平台配置 */
  usePlatform?: boolean;
  /** 是否启用 */
  enabled?: boolean;
  /** 最大在线时长（小时） */
  maxOnlineHours?: number;
  /** 最大并发会话数 */
  maxConcurrentSessions?: number;
  /** 并发策略 */
  concurrentStrategy?: string;
}
