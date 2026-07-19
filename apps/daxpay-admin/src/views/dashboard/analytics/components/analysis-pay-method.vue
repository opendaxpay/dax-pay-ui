<script lang="ts" setup>
  import type { NameValue } from '../types';

  import { computed, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  import ChartCard from '#/components/charts/ChartCard.vue';

  defineOptions({ name: 'AnalysisPayMethod' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    error: false,
    loading: false,
  });

  interface Props {
    /** 各支付方式交易额占比 */
    data?: NameValue[];
    /** 加载中(显示骨架屏) */
    loading?: boolean;
    /** 加载失败(显示错误占位) */
    error?: boolean;
  }

  defineEmits<{ retry: [] }>();

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  const isEmpty = computed(() => !props.data || props.data.length === 0);

  /** 渲染南丁格尔玫瑰饼图（半径反映数值大小） */
  function render(): void {
    if (!props.data || isEmpty.value) return;
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
  <ChartCard
    :empty="isEmpty"
    :error="error"
    :loading="loading"
    min-height="320px"
    skeleton-rows="6"
    @retry="$emit('retry')"
  >
    <template #title>{{ $t('dashboard.analytics.payMethod.title') }}</template>
    <EchartsUI ref="chartRef" class="h-[320px]" />
  </ChartCard>
</template>
