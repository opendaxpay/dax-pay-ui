import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 登录终端(身份域)主数据
 */
export interface ClientItem {
  /** 终端编码 admin/merchant/gateway */
  code: string;
  /** 展示名(当前语言) */
  name: string;
}

/**
 * 登录终端 API
 */
export const ClientApi = {
  /**
   * 查询全部登录终端(需登录)
   */
  findAll(): Promise<Result<ClientItem[]>> {
    return defHttp.get({ url: '/client/find-all' });
  },
};
