import type { AnalyticsData, DateRange, PresetKey } from '../types';

import { computed, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import dayjs from 'dayjs';

import { DashboardTradeApi } from '#/api/payment/dashboard/trade-dashboard.api';
import { providerI18nMap, providerNameMap } from '#/enums/payment/providerEnum';

import { emptyAnalyticsData } from '../types';

/** 预设范围 → [start, end]（YYYY-MM-DD）；本月取月初到今天（未来无数据） */
function computePreset(key: PresetKey): DateRange {
  const today = dayjs();
  switch (key) {
    case 'last7days': {
      return [today.subtract(6, 'day').format('YYYY-MM-DD'), today.format('YYYY-MM-DD')];
    }
    case 'last30days': {
      return [today.subtract(29, 'day').format('YYYY-MM-DD'), today.format('YYYY-MM-DD')];
    }
    case 'thisMonth': {
      return [today.startOf('month').format('YYYY-MM-DD'), today.format('YYYY-MM-DD')];
    }
    default: {
      return [today.subtract(6, 'day').format('YYYY-MM-DD'), today.format('YYYY-MM-DD')];
    }
  }
}

/** 支付渠道编码 → 展示名: 优先 i18n 映射, 无映射时降级原编码 */
function providerLabel(provider?: string): string {
  if (!provider) return '-';
  const i18nKey = providerI18nMap[provider];
  if (i18nKey) {
    const text = $t(i18nKey);
    if (text && text !== i18nKey) return text;
  }
  return providerNameMap[provider] ?? provider;
}

/** 金额分(后端) → 元(前端展示), 保留整数 */
function fenToYuan(fen?: number): number {
  if (!fen || fen <= 0) return 0;
  return Math.round(fen / 100);
}

/**
 * 环比百分比计算
 * @returns null 表示无法计算(prev 缺数据或为 0)
 */
function chainRatio(curr?: number, prev?: number): null | number {
  if (curr === undefined || prev === undefined || prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

/**
 * 分析页聚合数据异步加载 composable
 *
 * 按 dateRange 触发 8 个 API 并发加载(Promise.allSettled), 单个失败时该字段保留空,
 * 不影响其他图表。chainRatio(环比) 由前端基于后端返回的 curr/prev 字段计算。
 */
export function useAnalyticsData() {
  const activePreset = ref<PresetKey>('last7days');
  const customRange = ref<DateRange | undefined>(undefined);
  const isCustom = computed(() => activePreset.value === 'custom');

  watch(activePreset, (key) => {
    if (key !== 'custom') customRange.value = undefined;
  });

  const dateRange = computed<DateRange>(() => {
    if (activePreset.value === 'custom') {
      return customRange.value ?? computePreset('last7days');
    }
    return computePreset(activePreset.value);
  });

  const subtitle = computed(() => {
    const [start, end] = dateRange.value;
    const days = dayjs(end).diff(dayjs(start), 'day') + 1;
    return $t('dashboard.analytics.subtitle', { days, end, start });
  });

  const data = ref<AnalyticsData>(emptyAnalyticsData());
  const loading = ref(false);

  /** 各维度加载错误状态(true=加载失败, 显示 error 占位 + 重试) */
  const errors = ref({
    amountRange: false,
    channelSuccess: false,
    channelVolume: false,
    hourlyDist: false,
    merchantRank: false,
    overview: false,
    payMethod: false,
    refundTrend: false,
    tradeTrend: false,
  });

  /** 公共参数(start/end 同时传时优先区间模式) */
  function commonParams() {
    const [start, end] = dateRange.value;
    return { end, start };
  }

  /** 并发加载所有维度, allSettled 保证单个失败不阻塞其他 */
  async function load() {
    loading.value = true;
    try {
      const params = commonParams();
      const results = await Promise.allSettled([
        DashboardTradeApi.overview(params),
        DashboardTradeApi.trend(params),
        DashboardTradeApi.refundTrend(params),
        DashboardTradeApi.providerDist(params),
        DashboardTradeApi.providerSuccess(params),
        DashboardTradeApi.hourlyDist(params),
        DashboardTradeApi.amountRange(params),
        DashboardTradeApi.merchantRank({ ...params, limit: 10 }),
      ]);

      // 失败的维度记录到 errors(供组件显示 error 占位), 同时 console.warn 便于开发期排查
      const labels = [
        'overview',
        'tradeTrend',
        'refundTrend',
        'payMethod', // providerDist 同时驱动 payMethod 和 channelVolume
        'channelSuccess',
        'hourlyDist',
        'amountRange',
        'merchantRank',
      ] as const;
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.warn(`[analytics] ${labels[i]} 加载失败:`, r.reason);
        }
      });

      // providerDist 失败影响 payMethod + channelVolume 两个组件
      const providerDistFailed = results[3].status === 'rejected';
      errors.value = {
        amountRange: results[6].status === 'rejected',
        channelSuccess: results[4].status === 'rejected',
        channelVolume: providerDistFailed,
        hourlyDist: results[5].status === 'rejected',
        merchantRank: results[7].status === 'rejected',
        overview: results[0].status === 'rejected',
        payMethod: providerDistFailed,
        refundTrend: results[2].status === 'rejected',
        tradeTrend: results[1].status === 'rejected',
      };

      const overviewRes = results[0].status === 'fulfilled' ? results[0].value?.data : undefined;
      const trendRes = results[1].status === 'fulfilled' ? results[1].value?.data : undefined;
      const refundTrendRes = results[2].status === 'fulfilled' ? results[2].value?.data : undefined;
      const providerDistRes = results[3].status === 'fulfilled' ? results[3].value?.data : undefined;
      const providerSuccessRes = results[4].status === 'fulfilled' ? results[4].value?.data : undefined;
      const hourlyDistRes = results[5].status === 'fulfilled' ? results[5].value?.data : undefined;
      const amountRangeRes = results[6].status === 'fulfilled' ? results[6].value?.data : undefined;
      const merchantRankRes = results[7].status === 'fulfilled' ? results[7].value?.data : undefined;

      data.value = buildAnalyticsData({
        amountRangeRes,
        hourlyDistRes,
        merchantRankRes,
        overviewRes,
        providerDistRes,
        providerSuccessRes,
        refundTrendRes,
        trendRes,
      });
    } finally {
      loading.value = false;
    }
  }

  /** 手动重试(用户点击重试按钮) */
  function reload() {
    load();
  }

  // dateRange 变化即触发加载
  watch(dateRange, load, { immediate: true });

  return { activePreset, customRange, data, errors, isCustom, loading, reload, subtitle };
}

/** 将各 API 响应组装为 AnalyticsData */
function buildAnalyticsData(input: {
  amountRangeRes?: { bucket?: string; count?: number }[];
  hourlyDistRes?: { amount?: number; count?: number; hour?: number }[];
  merchantRankRes?: { amount?: number; merchantName?: string; orders?: number; proportion?: number }[];
  overviewRes?: {
    prevRefundAmount?: number;
    prevRefundCount?: number;
    prevSuccessAmount?: number;
    prevSuccessCount?: number;
    prevTotalOrders?: number;
    refundAmount?: number;
    refundCount?: number;
    successAmount?: number;
    successCount?: number;
    totalOrders?: number;
  };
  providerDistRes?: { amount?: number; count?: number; provider?: string }[];
  providerSuccessRes?: { provider?: string; rate?: number }[];
  refundTrendRes?: { amount?: number; count?: number; date?: string }[];
  trendRes?: { amount?: number; count?: number; date?: string }[];
}): AnalyticsData {
  const { overviewRes, trendRes, refundTrendRes, providerDistRes, providerSuccessRes, hourlyDistRes, amountRangeRes, merchantRankRes } = input;

  // ===== overview 6 卡片(含环比) =====
  const ov = overviewRes ?? {};
  const successAmountYuan = fenToYuan(ov.successAmount);
  const refundAmountYuan = fenToYuan(ov.refundAmount);
  const successCount = ov.successCount ?? 0;
  const totalOrders = ov.totalOrders ?? 0;
  const avgAmount = successCount > 0 ? Math.round((successAmountYuan / successCount) * 100) / 100 : 0;
  // 成功率口径: success_count / total_orders * 100(分子分母时间基准不同, 见后端 Mapper 注释)
  const successRate = totalOrders > 0 ? Math.round((successCount / totalOrders) * 1000) / 10 : 0;
  const refundRate = successAmountYuan > 0 ? Math.round((refundAmountYuan / successAmountYuan) * 1000) / 10 : 0;

  const overview = [
    { key: 'totalAmount', value: successAmountYuan, prefix: '¥', chainRatio: chainRatio(ov.successAmount, ov.prevSuccessAmount) },
    { key: 'totalOrders', value: successCount, chainRatio: chainRatio(ov.successCount, ov.prevSuccessCount) },
    { key: 'avgAmount', value: avgAmount, prefix: '¥', chainRatio: chainRatio(avgAmount, ov.prevSuccessAmount && ov.prevSuccessCount ? Math.round((ov.prevSuccessAmount / 100 / ov.prevSuccessCount) * 100) / 100 : undefined) },
    { key: 'successRate', value: successRate, suffix: '%', chainRatio: chainRatio(ov.successCount && ov.totalOrders ? successRate : undefined, ov.prevSuccessCount && ov.prevTotalOrders ? Math.round((ov.prevSuccessCount / ov.prevTotalOrders) * 1000) / 10 : undefined) },
    { key: 'refundAmount', value: refundAmountYuan, prefix: '¥', chainRatio: chainRatio(ov.refundAmount, ov.prevRefundAmount) },
    { key: 'refundRate', value: refundRate, suffix: '%', chainRatio: null },
  ];

  // ===== tradeTrend(按日期 + 多度量) =====
  // dates 保留 yyyy-MM-dd 原值(与 a-tooltip / 前端期望一致), amounts/orders 取后端原值, avgAmounts 派生
  const trendList = trendRes ?? [];
  const tradeTrend = {
    amounts: trendList.map((i) => fenToYuan(i.amount)),
    avgAmounts: trendList.map((i) => {
      const yuan = fenToYuan(i.amount);
      const cnt = i.count ?? 0;
      return cnt > 0 ? Math.round((yuan / cnt) * 100) / 100 : 0;
    }),
    dates: trendList.map((i) => i.date ?? ''),
    orders: trendList.map((i) => i.count ?? 0),
  };

  // ===== refundTrend(按日期) =====
  const refundTrend = {
    amounts: (refundTrendRes ?? []).map((i) => fenToYuan(i.amount)),
    dates: (refundTrendRes ?? []).map((i) => i.date ?? ''),
  };

  // ===== payMethod(支付方式占比饼图, 用 provider amount) =====
  const payMethod = (providerDistRes ?? []).map((i) => ({
    name: providerLabel(i.provider),
    value: fenToYuan(i.amount),
  }));

  // ===== channelVolume(渠道交易量柱状图, 用 provider count) =====
  const channelVolume = (providerDistRes ?? []).map((i) => ({
    name: providerLabel(i.provider),
    value: i.count ?? 0,
  }));

  // ===== channelSuccess(渠道成功率) =====
  const channelSuccess = (providerSuccessRes ?? []).map((i) => ({
    name: providerLabel(i.provider),
    rate: i.rate ?? 0,
  }));

  // ===== hourlyDist(24 小时时段, 取 count 数组) =====
  // 后端返回 0-23 已补齐, 取 count 字段(原前端约定: 柱状图值)
  const hourlyDist = (hourlyDistRes ?? []).map((i) => i.count ?? 0);

  // ===== amountRange(金额区间分桶) =====
  const amountRange = (amountRangeRes ?? []).map((i) => ({
    count: i.count ?? 0,
    range: i.bucket ?? '',
  }));

  // ===== merchantRank =====
  const merchantRank = (merchantRankRes ?? []).map((i) => ({
    amount: fenToYuan(i.amount),
    merchantName: i.merchantName ?? '-',
    orders: i.orders ?? 0,
    proportion: i.proportion ?? 0,
  }));

  return { amountRange, channelSuccess, channelVolume, hourlyDist, merchantRank, overview, payMethod, refundTrend, tradeTrend };
}
