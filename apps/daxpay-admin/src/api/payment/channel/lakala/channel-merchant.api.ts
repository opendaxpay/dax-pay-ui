import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 拉卡拉通道商户创建 API
 */
export const ChannelMerchantLakalaApi = {
  /**
   * 创建拉卡拉通道商户
   */
  create(data: Record<string, any>): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/lakala/channel-merchant/create', data });
  },
};
