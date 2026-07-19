<script lang="ts" setup>
  import type { NameValue } from '../types';

  import { computed, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  import ChartCard from '#/components/charts/ChartCard.vue';

  defineOptions({ name: 'AnalysisChannelVolume' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    error: false,
    loading: false,
  });

  interface Props {
    /** 各支付通道交易笔数 */
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

  /** 渲染渠道交易量柱状图（纵向，反映各渠道负载） */
  function render(): void {
    if (!props.data || isEmpty.value) return;
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
  <ChartCard
    :empty="isEmpty"
    :error="error"
    :loading="loading"
    min-height="320px"
    skeleton-rows="6"
    @retry="$emit('retry')"
  >
    <template #title>{{ $t('dashboard.analytics.channelVolume.title') }}</template>
    <EchartsUI ref="chartRef" class="h-[320px]" />
  </ChartCard>
</template>
