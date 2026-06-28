<script lang="ts" setup>
  import type { NameValue } from '../types';

  import { onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  defineOptions({ name: 'AnalysisChannelVolume' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  interface Props {
    /** 各支付通道交易笔数 */
    data?: NameValue[];
  }

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  /** 渲染渠道交易量柱状图（纵向，反映各渠道负载） */
  function render(): void {
    if (!props.data) return;
    renderEcharts({
      grid: { bottom: '8%', containLabel: true, left: '3%', right: '4%', top: '8%' },
      series: [
        {
          barWidth: '45%',
          data: props.data.map((i) => i.value),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          type: 'bar',
        },
      ],
      tooltip: { trigger: 'axis' },
      xAxis: {
        axisLabel: { fontSize: 11 },
        type: 'category',
        data: props.data.map((i) => i.name),
      },
      yAxis: { axisLabel: { fontSize: 11 }, type: 'value' },
    });
  }

  watch(() => props.data, render, { deep: true });
  onMounted(render);
</script>

<template>
  <a-card variant="borderless" class="!h-full min-h-[320px] !bg-card">
    <template #title>{{ $t('dashboard.analytics.channelVolume.title') }}</template>

    <EchartsUI ref="chartRef" class="h-[320px]" />
  </a-card>
</template>
