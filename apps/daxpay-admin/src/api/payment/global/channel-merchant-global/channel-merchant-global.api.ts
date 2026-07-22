import type { PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

import type {
  ChannelMerchantEditParam,
  ChannelMerchantQueryParam,
  ChannelMerchantResult,
} from '../channel-merchant/channel-merchant.api';

/**
 * 通道商户全局管理 API（运营平台-综合管理）
 * 与商户入口接口分离，提供跨商户的全局视图
 */
export const ChannelMerchantGlobalApi = {
  /**
   * 分页查询（全局，跨商户）
   */
  page(params: ChannelMerchantQueryParam): Promise<Result<PageResult<ChannelMerchantResult>>> {
    return defHttp.get({ url: '/admin/channel/merchant/page', params });
  },
  /**
   * 查询详情
   */
  findById(id: string): Promise<Result<ChannelMerchantResult>> {
    return defHttp.get({ url: '/admin/channel/merchant/get', params: { id } });
  },
  /**
   * 更新启用状态
   */
  updateEnable(id: string, enable: boolean): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/channel/merchant/update-enable', params: { id, enable } });
  },
  /**
   * 修改商户名称
   */
  update(data: ChannelMerchantEditParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/channel/merchant/update', data });
  },
};
