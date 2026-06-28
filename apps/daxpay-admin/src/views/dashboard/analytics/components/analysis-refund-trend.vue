<script lang="ts" setup>
  import { onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  defineOptions({ name: 'AnalysisRefundTrend' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  interface Props {
    /** 退款趋势（日期 + 退款额） */
    data?: { amounts: number[]; dates: string[] };
  }

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  /** 渲染退款额折线图（带面积渐变） */
  function render(): void {
    if (!props.data) return;
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
          data: props.data.amounts,
          itemStyle: { color: '#ff7875' },
          smooth: true,
          type: 'line',
        },
      ],
    });
  }

  watch(() => props.data, render, { deep: true });
  onMounted(render);
</script>

<template>
  <a-card variant="borderless" class="!h-full min-h-[320px] !bg-card">
    <template #title>{{ $t('dashboard.analytics.refundTrend.title') }}</template>

    <EchartsUI ref="chartRef" class="h-[320px]" />
  </a-card>
</template>
