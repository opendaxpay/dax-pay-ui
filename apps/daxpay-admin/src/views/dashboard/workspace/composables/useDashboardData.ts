import type { DashboardData } from '../types';

import { reactive } from 'vue';

import { UserApi } from '#/api/iam/user.api';
import { ChannelMerchantApi } from '#/api/payment/global/channel-merchant/channel-merchant.api';
import { MerchantApi } from '#/api/payment/merchant/merchant.api';

/**
 * 工作台聚合数据 Hook
 *
 * 当前通过各 list 接口的 size=1 取 total 字段作为计数过渡方案
 * 后端补齐 dashboard 聚合统计 API 后，可整体替换为本 hook 内部实现，调用方无需改动
 *
 * 使用 reactive 包裹整体返回，便于作为 props 直接下发且类型为 DashboardData
 */
export function useDashboardData(): DashboardData {
  // 整体 reactive：refresh 修改字段时模板响应式更新
  const data = reactive<DashboardData>({
    stats: {
      merchantCount: 0,
      channelMerchantCount: 0,
      userCount: 0,
    },
    loading: false,
    // 异步刷新：拉取各业务域计数
    async refresh() {
      data.loading = true;
      // 并行请求各项计数：size=1 仅取 total，最小化数据传输
      const [merchant, channelMerchant, user] = await Promise.all([
        MerchantApi.page({ current: 1, size: 1 }),
        ChannelMerchantApi.page({ current: 1, size: 1 }),
        UserApi.page({ current: 1, size: 1, clientCode: 'admin' }),
      ]);
      // 各 API 返回结构：{ code, data: { records, total }, message }
      data.stats.merchantCount = Number((merchant as any)?.data?.total) || 0;
      data.stats.channelMerchantCount = Number((channelMerchant as any)?.data?.total) || 0;
      data.stats.userCount = Number((user as any)?.data?.total) || 0;
      data.loading = false;
    },
  });

  return data;
}
