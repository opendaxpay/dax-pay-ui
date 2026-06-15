import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 抖音通道商户创建 API
 */
export const ChannelMerchantDouyinApi = {
  /**
   * 创建抖音通道商户
   */
  create(data: Record<string, any>): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/channel-merchant/create', data });
  },
};
