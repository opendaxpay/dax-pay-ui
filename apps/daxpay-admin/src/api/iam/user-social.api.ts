import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 社交账号绑定结果
 */
export interface SocialBindResult {
  /** 主键 */
  id?: string;
  /** 本地用户ID */
  userId?: string;
  /** 终端编码 */
  clientCode?: string;
  /** 平台编码 */
  source?: string;
  /** 平台用户唯一标识 */
  openId?: string;
  /** 平台昵称 */
  username?: string;
  /** 平台头像 */
  avatar?: string;
  /** 绑定时间 */
  createTime?: string;
}

/**
 * 用户三方账号绑定管理 API (管理员)
 *
 * 与登录/绑定流程的 SocialApi 完全分离, 归属用户管理域.
 */
export const UserSocialApi = {
  /**
   * 查询指定用户的第三方账号绑定列表
   * @param userId 目标用户ID
   */
  bindList(userId: string): Promise<Result<SocialBindResult[]>> {
    return defHttp.get({ url: '/user/admin/social/bind-list', params: { userId } });
  },

  /**
   * 解除指定用户的第三方账号绑定
   * @param userId   目标用户ID
   * @param source   平台编码
   */
  unbind(userId: string, source: string): Promise<Result<void>> {
    return defHttp.post({ url: '/user/admin/social/unbind', params: { userId, source } });
  },
};
