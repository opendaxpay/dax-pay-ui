import type { AnalyticsData, DateRange, PresetKey } from '../types';

import { computed, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import dayjs from 'dayjs';

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

/** 按 [start, end] 生成日期标签（MM-DD，含首尾） */
function genDateLabels(start: string, end: string): string[] {
  const labels: string[] = [];
  let cur = dayjs(start);
  const last = dayjs(end);
  while (cur.isBefore(last) || cur.isSame(last, 'day')) {
    labels.push(cur.format('MM-DD'));
    cur = cur.add(1, 'day');
  }
  return labels;
}

/** 基于索引的稳定波动函数（同输入同输出，避免每次切换数据跳变） */
function wave(i: number, seed: number): number {
  return Math.sin(i * 0.8 + seed) * 0.5 + Math.cos(i * 1.3 + seed) * 0.3;
}

/** 按日期范围构造全量 mock 数据（后端聚合 API 就绪后替换为真实请求） */
function buildData(start: string, end: string): AnalyticsData {
  const dates = genDateLabels(start, end);
  const n = dates.length;

  // 交易额（元）：基线 + 上升趋势 + 周期波动
  const amounts = dates.map((_, i) => Math.round(50_000 + i * 600 + wave(i, 1) * 12_000));
  // 交易笔数
  const orders = dates.map((_, i) => Math.round(800 + i * 8 + wave(i, 2) * 120));
  // 客单价 = 交易额 / 笔数
  const avgAmounts = amounts.map((a, i) => Math.round(a / (orders[i] || 1)));

  // 汇总指标
  const totalAmount = amounts.reduce((s, v) => s + v, 0);
  const totalOrders = orders.reduce((s, v) => s + v, 0);
  const refundAmount = Math.round(totalAmount * 0.038);
  const avgAmount = Math.round(totalAmount / totalOrders);

  // 环比百分比（mock，随范围稳定）
  const ratio = (base: number, seed: number) => Math.round((base + wave(n, seed) * 5) * 10) / 10;

  // 退款趋势（元）
  const refundTrendAmounts = dates.map((_, i) => Math.round(1800 + wave(i, 3) * 600 + i * 20));

  // 24h 时段分布：模拟双高峰（午间 12 点、晚间 20 点），凌晨低谷
  const hourlyDist = Array.from({ length: 24 }).map((_, h) => {
    const noonPeak = Math.exp(-Math.pow((h - 12) / 4, 2)) * 1000;
    const eveningPeak = Math.exp(-Math.pow((h - 20) / 3, 2)) * 800;
    const noise = wave(h, 4) * 100;
    return Math.max(50, Math.round(noonPeak + eveningPeak + noise + 100));
  });

  return {
    overview: [
      { key: 'totalAmount', value: totalAmount, prefix: '¥', chainRatio: ratio(8.5, 1) },
      { key: 'totalOrders', value: totalOrders, chainRatio: ratio(6.2, 2) },
      { key: 'avgAmount', value: avgAmount, prefix: '¥', chainRatio: ratio(2.1, 3) },
      { key: 'successRate', value: 97.6, suffix: '%', chainRatio: ratio(0.3, 4) },
      { key: 'refundAmount', value: refundAmount, prefix: '¥', chainRatio: ratio(-3.4, 5) },
      { key: 'refundRate', value: 3.8, suffix: '%', chainRatio: ratio(-1.2, 6) },
    ],
    tradeTrend: { amounts, avgAmounts, dates, orders },
    payMethod: [
      { name: $t('payment.channel.common.wechat'), value: 38 },
      { name: $t('payment.channel.common.alipay'), value: 28 },
      { name: $t('payment.channel.common.unionPay'), value: 18 },
      { name: $t('payment.channel.common.visa'), value: 8 },
      { name: $t('payment.channel.common.mastercard'), value: 5 },
      { name: $t('payment.channel.common.douyin'), value: 3 },
    ],
    channelSuccess: [
      { name: $t('payment.channel.common.alipay'), rate: 99.2 },
      { name: $t('payment.channel.common.wechat'), rate: 98.7 },
      { name: $t('payment.channel.common.unionPay'), rate: 97.5 },
      { name: $t('payment.channel.common.douyin'), rate: 96.3 },
      { name: $t('payment.channel.common.visa'), rate: 95.8 },
      { name: $t('payment.channel.common.mastercard'), rate: 94.6 },
    ],
    hourlyDist,
    amountRange: [
      { count: 3200, range: '0-50' },
      { count: 5800, range: '50-200' },
      { count: 4200, range: '200-1000' },
      { count: 1800, range: '1000-5000' },
      { count: 600, range: '5000+' },
    ],
    channelVolume: [
      { name: $t('payment.channel.common.wechat'), value: 45_000 },
      { name: $t('payment.channel.common.alipay'), value: 32_000 },
      { name: $t('payment.channel.common.unionPay'), value: 12_000 },
      { name: $t('payment.channel.common.visa'), value: 8000 },
      { name: $t('payment.channel.common.mastercard'), value: 6000 },
      { name: $t('payment.channel.common.douyin'), value: 3000 },
    ],
    refundTrend: { amounts: refundTrendAmounts, dates },
    merchantRank: [
      { amount: 520_000, merchantName: '云端科技有限公司', orders: 12_300, proportion: 18.5 },
      { amount: 438_000, merchantName: '数聚信息科技', orders: 9800, proportion: 15.6 },
      { amount: 362_000, merchantName: '极客电子商务', orders: 8600, proportion: 12.9 },
      { amount: 298_000, merchantName: '智慧零售集团', orders: 7200, proportion: 10.6 },
      { amount: 245_000, merchantName: '新橙科技', orders: 5900, proportion: 8.7 },
      { amount: 198_000, merchantName: '环球贸易有限公司', orders: 4700, proportion: 7.1 },
      { amount: 165_000, merchantName: '蓝海传媒', orders: 3900, proportion: 5.9 },
      { amount: 132_000, merchantName: '星辰网络', orders: 3100, proportion: 4.7 },
      { amount: 98_000, merchantName: '迅捷物流', orders: 2300, proportion: 3.5 },
      { amount: 76_000, merchantName: '橙意生活', orders: 1800, proportion: 2.7 },
    ],
  };
}

export function useAnalyticsData() {
  // 当前模式（预设 key 或 'custom' 自定义）
  const activePreset = ref<PresetKey>('last7days');
  // 自定义日期范围（仅 custom 模式生效）
  const customRange = ref<DateRange | undefined>(undefined);

  // 是否自定义模式（控制 RangePicker 启用/禁用）
  const isCustom = computed(() => activePreset.value === 'custom');

  // 选预设时清空自定义范围（避免残留）
  watch(activePreset, (key) => {
    if (key !== 'custom') customRange.value = undefined;
  });

  // 真实数据源：custom 走自定义范围（未选时兜底近7天），否则走预设
  const dateRange = computed<DateRange>(() => {
    if (activePreset.value === 'custom') {
      return customRange.value ?? computePreset('last7days');
    }
    return computePreset(activePreset.value);
  });

  // 副标题：动态日期摘要（与右侧选择器联动）
  const subtitle = computed(() => {
    const [start, end] = dateRange.value;
    const days = dayjs(end).diff(dayjs(start), 'day') + 1;
    return $t('dashboard.analytics.subtitle', { days, end, start });
  });

  // 按日期范围派生的全量数据
  const data = computed(() => buildData(dateRange.value[0], dateRange.value[1]));

  return { activePreset, customRange, data, isCustom, subtitle };
}
