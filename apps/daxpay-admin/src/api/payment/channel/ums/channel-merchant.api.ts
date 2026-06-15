import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 银联商务通道商户创建 API
 */
export const ChannelMerchantUmsApi = {
  /**
   * 创建银联商务通道商户
   */
  create(data: Record<string, any>): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/ums/channel-merchant/create', data });
  },
};
