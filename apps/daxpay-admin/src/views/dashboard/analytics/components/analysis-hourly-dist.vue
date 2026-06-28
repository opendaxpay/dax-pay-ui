<script lang="ts" setup>
  import { onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  defineOptions({ name: 'AnalysisHourlyDist' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  interface Props {
    /** 24 小时交易分布（长度 24 数组，下标即小时） */
    data?: number[];
  }

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  /** 渲染 24 小时段柱状图（识别交易高峰时段） */
  function render(): void {
    if (!props.data) return;
    const hours = Array.from({ length: 24 }).map((_, i) => `${i}`);
    renderEcharts({
      grid: { bottom: '8%', containLabel: true, left: '3%', right: '4%', top: '8%' },
      series: [
        {
          barWidth: '60%',
          data: props.data,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          type: 'bar',
        },
      ],
      tooltip: { formatter: '{b}:00 — {c}', trigger: 'axis' },
      xAxis: { axisLabel: { fontSize: 11 }, type: 'category', data: hours },
      yAxis: { axisLabel: { fontSize: 11 }, type: 'value' },
    });
  }

  watch(() => props.data, render, { deep: true });
  onMounted(render);
</script>

<template>
  <a-card variant="borderless" class="!h-full min-h-[320px] !bg-card">
    <template #title>{{ $t('dashboard.analytics.hourlyDist.title') }}</template>

    <EchartsUI ref="chartRef" class="h-[320px]" />
  </a-card>
</template>
