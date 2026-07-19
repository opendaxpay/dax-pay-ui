<script lang="ts" setup>
  import type { AmountRangeItem } from '../types';

  import { onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  defineOptions({ name: 'AnalysisAmountRange' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    loading: false,
  });

  interface Props {
    /** 单笔金额区间分桶（用户消费特征） */
    data?: AmountRangeItem[];
    /** 加载中(显示骨架屏) */
    loading?: boolean;
  }

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  /** 渲染金额区间柱状图（识别小额高频 / 大额低频） */
  function render(): void {
    if (!props.data) return;
    renderEcharts({
      grid: { bottom: '8%', containLabel: true, left: '3%', right: '4%', top: '8%' },
      series: [
        {
          barWidth: '50%',
          data: props.data.map((i) => i.count),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          type: 'bar',
        },
      ],
      tooltip: { trigger: 'axis' },
      xAxis: {
        axisLabel: { fontSize: 11 },
        type: 'category',
        data: props.data.map((i) => i.range),
      },
      yAxis: { axisLabel: { fontSize: 11 }, type: 'value' },
    });
  }

  watch(() => props.data, render, { deep: true });
  onMounted(render);
</script>

<template>
  <a-card variant="borderless" class="!h-full min-h-[320px] !bg-card">
    <template #title>{{ $t('dashboard.analytics.amountRange.title') }}</template>

    <a-skeleton v-if="loading" active :paragraph="{ rows: 6 }" />
    <EchartsUI v-else ref="chartRef" class="h-[320px]" />
  </a-card>
</template>
