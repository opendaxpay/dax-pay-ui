<script lang="ts" setup>
  import type { TrendMetric, TrendSeries } from '../types';

  import { onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  defineOptions({ name: 'AnalysisTradeTrend' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  interface Props {
    /** 交易趋势序列（日期 + 多度量） */
    data?: TrendSeries;
  }

  // 度量切换：交易额 / 交易笔数 / 客单价
  const activeMetric = ref<TrendMetric>('amount');

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  /** 按当前度量渲染折线图（带面积渐变） */
  function render(): void {
    if (!props.data) return;
    const seriesData =
      activeMetric.value === 'amount'
        ? props.data.amounts
        : activeMetric.value === 'orders'
          ? props.data.orders
          : props.data.avgAmounts;
    renderEcharts({
      grid: { bottom: '8%', containLabel: true, left: '3%', right: '4%', top: '10%' },
      tooltip: { trigger: 'axis' },
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
  <a-card variant="borderless" class="!h-full min-h-[320px] !bg-card">
    <template #title>{{ $t('dashboard.analytics.tradeTrend.title') }}</template>
    <template #extra>
      <a-radio-group v-model:value="activeMetric" button-style="solid" size="small">
        <a-radio-button value="amount">{{ $t('dashboard.analytics.tradeTrend.amount') }}</a-radio-button>
        <a-radio-button value="orders">{{ $t('dashboard.analytics.tradeTrend.orders') }}</a-radio-button>
        <a-radio-button value="avgAmount">{{ $t('dashboard.analytics.tradeTrend.avgAmount') }}</a-radio-button>
      </a-radio-group>
    </template>

    <EchartsUI ref="chartRef" class="h-[320px]" />
  </a-card>
</template>
