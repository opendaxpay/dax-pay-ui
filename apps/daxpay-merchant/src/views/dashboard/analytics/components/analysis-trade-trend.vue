<script lang="ts" setup>
  import type { TrendMetric, TrendSeries } from '../types';

  import { computed, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  import ChartCard from '#/components/charts/ChartCard.vue';
  import { formatYuan } from '#/utils/pay-amount';

  defineOptions({ name: 'AnalysisTradeTrend' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    error: false,
    loading: false,
  });

  interface Props {
    /** 交易趋势序列（日期 + 多度量） */
    data?: TrendSeries;
    /** 加载中(显示骨架屏) */
    loading?: boolean;
    /** 加载失败(显示错误占位) */
    error?: boolean;
  }

  defineEmits<{ retry: [] }>();

  // 度量切换：交易额 / 交易笔数 / 客单价
  const activeMetric = ref<TrendMetric>('amount');

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  // 空数据判断: 无日期或所有笔数都是 0（按笔数，避免小额成交被当成空）
  const isEmpty = computed(() => {
    if (!props.data || props.data.dates.length === 0) return true;
    return props.data.orders.every((v) => !v);
  });

  /** 按当前度量渲染折线图（带面积渐变） */
  function render(): void {
    if (!props.data || isEmpty.value) return;
    const seriesData =
      activeMetric.value === 'amount'
        ? props.data.amounts
        : activeMetric.value === 'orders'
          ? props.data.orders
          : props.data.avgAmounts;
    renderEcharts({
      grid: { bottom: '8%', containLabel: true, left: '3%', right: '4%', top: '10%' },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (val: any) =>
          activeMetric.value === 'orders' ? String(val) : `¥${formatYuan(Number(val))}`,
      },
      xAxis: {
        axisLabel: { fontSize: 11 },
        boundaryGap: false,
        type: 'category',
        data: props.data.dates,
      },
      yAxis: { axisLabel: { fontSize: 11 }, type: 'value' },
      series: [
        {
          areaStyle: { opacity: 0.15 },
          data: seriesData,
          smooth: true,
          type: 'line',
        },
      ],
    });
  }

  watch(() => props.data, render, { deep: true });
  watch(activeMetric, render);
  onMounted(render);
</script>

<template>
  <ChartCard
    :empty="isEmpty"
    :error="error"
    :loading="loading"
    min-height="320px"
    :skeleton-rows="6"
    @retry="$emit('retry')"
  >
    <template #title>{{ $t('dashboard.analytics.tradeTrend.title') }}</template>
    <template #extra>
      <a-radio-group v-model:value="activeMetric" button-style="solid" size="small">
        <a-radio-button value="amount">{{ $t('dashboard.analytics.tradeTrend.amount') }}</a-radio-button>
        <a-radio-button value="orders">{{ $t('dashboard.analytics.tradeTrend.orders') }}</a-radio-button>
        <a-radio-button value="avgAmount">{{ $t('dashboard.analytics.tradeTrend.avgAmount') }}</a-radio-button>
      </a-radio-group>
    </template>
    <EchartsUI ref="chartRef" class="h-[320px]" />
  </ChartCard>
</template>
