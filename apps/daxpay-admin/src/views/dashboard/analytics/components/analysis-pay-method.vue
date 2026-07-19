<script lang="ts" setup>
  import type { NameValue } from '../types';

  import { onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  defineOptions({ name: 'AnalysisPayMethod' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    loading: false,
  });

  interface Props {
    /** 各支付方式交易额占比 */
    data?: NameValue[];
    /** 加载中(显示骨架屏) */
    loading?: boolean;
  }

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  /** 渲染南丁格尔玫瑰饼图（半径反映数值大小） */
  function render(): void {
    if (!props.data) return;
    renderEcharts({
      legend: { bottom: 0, orient: 'horizontal' },
      series: [
        {
          label: { formatter: '{d}%', show: true },
          radius: ['20%', '75%'],
          roseType: 'radius',
          type: 'pie',
          data: props.data,
        },
      ],
      tooltip: { trigger: 'item' },
    });
  }

  watch(() => props.data, render, { deep: true });
  onMounted(render);
</script>

<template>
  <a-card variant="borderless" class="!h-full min-h-[320px] !bg-card">
    <template #title>{{ $t('dashboard.analytics.payMethod.title') }}</template>

    <a-skeleton v-if="loading" active :paragraph="{ rows: 6 }" />
    <EchartsUI v-else ref="chartRef" class="h-[320px]" />
  </a-card>
</template>
