import type { DashboardData } from '../types';

import { reactive } from 'vue';

import { DashboardTradeApi } from '#/api/payment/dashboard/trade-dashboard.api';
import { toNumber } from '#/utils/pay-amount';

/**
 * 工作台聚合数据 Hook
 *
 * 通过商户端 dashboard 聚合 API 拉取头部计数, 下发给 workbench-header widget。
 *
 * 使用 reactive 包裹整体返回，便于作为 props 直接下发且类型为 DashboardData
 */
export function useDashboardData(): DashboardData {
  // 整体 reactive：refresh 修改字段时模板响应式更新
  const data = reactive<DashboardData>({
    stats: {
      appCount: 0,
      channelMerchantCount: 0,
      storeCount: 0,
    },
    loading: false,
    // 异步刷新：拉取头部计数
    async refresh() {
      data.loading = true;
      const { data: counts } = await DashboardTradeApi.headerCounts();
      data.stats.appCount = toNumber(counts?.appCount) ?? 0;
      data.stats.storeCount = toNumber(counts?.storeCount) ?? 0;
      data.stats.channelMerchantCount = toNumber(counts?.channelMerchantCount) ?? 0;
      data.loading = false;
    },
  });

  return data;
}
