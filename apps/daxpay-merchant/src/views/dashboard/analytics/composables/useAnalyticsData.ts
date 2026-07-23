import type { AnalyticsData, ChainRatioResult, DateRange, PresetKey } from '../types';

import { computed, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import dayjs from 'dayjs';

import { DashboardTradeApi } from '#/api/payment/dashboard/trade-dashboard.api';
import { providerI18nMap, providerNameMap } from '#/enums/payment/providerEnum';
import { fenToYuan, toNumber } from '#/utils/pay-amount';

import { emptyAnalyticsData } from '../types';

/** 预设范围 → [start, end]（YYYY-MM-DD）；本月取月初到今天（未来无数据） */
function computePreset(key: PresetKey): DateRange {
  const today = dayjs();
  const todayStr = today.format('YYYY-MM-DD');
  switch (key) {
    case 'today': {
      return [todayStr, todayStr];
    }
    case 'yesterday': {
      const y = today.subtract(1, 'day').format('YYYY-MM-DD');
      return [y, y];
    }
    case 'last7days': {
      return [today.subtract(6, 'day').format('YYYY-MM-DD'), todayStr];
    }
    case 'last30days': {
      return [today.subtract(29, 'day').format('YYYY-MM-DD'), todayStr];
    }
    case 'thisMonth': {
      return [today.startOf('month').format('YYYY-MM-DD'), todayStr];
    }
    default: {
      return [today.subtract(6, 'day').format('YYYY-MM-DD'), todayStr];
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

/**
 * 环比三态计算
 *
 * - 上期 > 0: { type:'pct', value } 正常涨跌百分比
 * - 上期 = 0 且本期 > 0: { type:'new' } 上期无基数, 不造假百分比
 * - 其余(缺数据 / 双 0): null → 显示 —
 *
 * 后端 Long 经 JavaLongTypeModule 序列化为字符串，须先 toNumber。
 */
function chainRatio(curr?: null | number | string, prev?: null | number | string): ChainRatioResult {
  const c = toNumber(curr);
  const p = toNumber(prev);
  if (c === undefined || p === undefined) return null;
  if (p === 0) {
    return c > 0 ? { type: 'new' } : null;
  }
  return { type: 'pct', value: Math.round(((c - p) / p) * 1000) / 10 };
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

      data.value = buildAnalyticsData({
        amountRangeRes,
        hourlyDistRes,
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

  return { activePreset, customRange, data, dateRange, errors, isCustom, loading, reload, subtitle };
}

/** 将各 API 响应组装为 AnalyticsData */
function buildAnalyticsData(input: {
  amountRangeRes?: { bucket?: string; count?: number | string }[];
  hourlyDistRes?: { amount?: number | string; count?: number | string; hour?: number }[];
  overviewRes?: {
    prevRefundAmount?: number | string;
    prevRefundCount?: number | string;
    prevSuccessAmount?: number | string;
    prevSuccessCount?: number | string;
    prevTotalOrders?: number | string;
    refundAmount?: number | string;
    refundCount?: number | string;
    successAmount?: number | string;
    successCount?: number | string;
    totalOrders?: number | string;
  };
  providerDistRes?: { amount?: number | string; count?: number | string; provider?: string }[];
  providerSuccessRes?: { provider?: string; rate?: number }[];
  refundTrendRes?: { amount?: number | string; count?: number | string; date?: string }[];
  trendRes?: { amount?: number | string; count?: number | string; date?: string }[];
}): AnalyticsData {
  const { overviewRes, trendRes, refundTrendRes, providerDistRes, providerSuccessRes, hourlyDistRes, amountRangeRes } = input;

  // ===== overview 6 卡片(含环比) =====
  const ov = overviewRes ?? {};
  const successAmountYuan = fenToYuan(ov.successAmount);
  const refundAmountYuan = fenToYuan(ov.refundAmount);
  const successCount = toNumber(ov.successCount) ?? 0;
  const totalOrders = toNumber(ov.totalOrders) ?? 0;
  const prevSuccessCount = toNumber(ov.prevSuccessCount) ?? 0;
  const prevTotalOrders = toNumber(ov.prevTotalOrders) ?? 0;
  // 客单价: 元 / 笔, 保留 2 位
  const avgAmount = successCount > 0 ? Math.round((successAmountYuan / successCount) * 100) / 100 : 0;
  const prevAvgAmount =
    prevSuccessCount > 0 ? Math.round((fenToYuan(ov.prevSuccessAmount) / prevSuccessCount) * 100) / 100 : undefined;
  // 成功率口径: success_count / total_orders * 100(分子分母时间基准不同, 见后端 Mapper 注释)
  const successRate = totalOrders > 0 ? Math.round((successCount / totalOrders) * 1000) / 10 : 0;
  const prevSuccessRate =
    prevTotalOrders > 0 ? Math.round((prevSuccessCount / prevTotalOrders) * 1000) / 10 : undefined;
  const refundRate = successAmountYuan > 0 ? Math.round((refundAmountYuan / successAmountYuan) * 1000) / 10 : 0;

  const overview = [
    { key: 'totalAmount', value: successAmountYuan, prefix: '¥', chainRatio: chainRatio(ov.successAmount, ov.prevSuccessAmount) },
    { key: 'totalOrders', value: successCount, chainRatio: chainRatio(ov.successCount, ov.prevSuccessCount) },
    { key: 'avgAmount', value: avgAmount, prefix: '¥', chainRatio: chainRatio(avgAmount, prevAvgAmount) },
    {
      key: 'successRate',
      value: successRate,
      suffix: '%',
      chainRatio: chainRatio(totalOrders > 0 ? successRate : undefined, prevSuccessRate),
    },
    { key: 'refundAmount', value: refundAmountYuan, prefix: '¥', chainRatio: chainRatio(ov.refundAmount, ov.prevRefundAmount) },
    { key: 'refundRate', value: refundRate, suffix: '%', chainRatio: null },
  ];

  // ===== tradeTrend(按日期 + 多度量) =====
  // dates 保留 yyyy-MM-dd; amounts 为元(2 位小数); orders 为笔数(已 Number 归一)
  const trendList = trendRes ?? [];
  const tradeTrend = {
    amounts: trendList.map((i) => fenToYuan(i.amount)),
    avgAmounts: trendList.map((i) => {
      const yuan = fenToYuan(i.amount);
      const cnt = toNumber(i.count) ?? 0;
      return cnt > 0 ? Math.round((yuan / cnt) * 100) / 100 : 0;
    }),
    dates: trendList.map((i) => i.date ?? ''),
    orders: trendList.map((i) => toNumber(i.count) ?? 0),
  };

  // ===== refundTrend(按日期) =====
  const refundTrend = {
    amounts: (refundTrendRes ?? []).map((i) => fenToYuan(i.amount)),
    // 笔数用于空态判断(有成交但金额极小也不应显示 empty)
    counts: (refundTrendRes ?? []).map((i) => toNumber(i.count) ?? 0),
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
    value: toNumber(i.count) ?? 0,
  }));

  // ===== channelSuccess(渠道成功率) =====
  const channelSuccess = (providerSuccessRes ?? []).map((i) => ({
    name: providerLabel(i.provider),
    // 后端 NULLIF 防除零, 这里 Number.isFinite 二次兜底防异常值
    rate: Number.isFinite(i.rate) ? (i.rate as number) : 0,
  }));

  // ===== hourlyDist(24 小时时段日均笔数数组) =====
  // 后端已按区间天数日均化, 取 count 字段(原前端约定: 柱状图值)
  const hourlyDist = (hourlyDistRes ?? []).map((i) => toNumber(i.count) ?? 0);

  // ===== amountRange(金额区间分桶) =====
  const amountRange = (amountRangeRes ?? []).map((i) => ({
    count: toNumber(i.count) ?? 0,
    range: i.bucket ?? '',
  }));

  return { amountRange, channelSuccess, channelVolume, hourlyDist, overview, payMethod, refundTrend, tradeTrend };
}
