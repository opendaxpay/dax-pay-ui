import type { DashboardData } from '../types';

import { reactive } from 'vue';

import { DashboardTradeApi } from '#/api/payment/dashboard/trade-dashboard.api';

/**
 * 工作台聚合数据 Hook
 *
 * 头部统计(商户/通道商户/运营用户)走后端聚合接口 headerCounts
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
    // 异步刷新：拉取头部计数聚合数据
    async refresh() {
      data.loading = true;
      const res = await DashboardTradeApi.headerCounts();
      const d = res.data;
      // 后端 Long 字段可能序列化为字符串，统一 Number 转换
      data.stats.merchantCount = Number(d?.merchantCount) || 0;
      data.stats.channelMerchantCount = Number(d?.channelMerchantCount) || 0;
      data.stats.userCount = Number(d?.userCount) || 0;
      data.loading = false;
    },
  });

  return data;
}
