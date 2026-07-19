<script lang="ts" setup>
  import type { AmountRangeItem } from '../types';

  import { computed, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  import ChartCard from '#/components/charts/ChartCard.vue';

  defineOptions({ name: 'AnalysisAmountRange' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    error: false,
    loading: false,
  });

  interface Props {
    /** 单笔金额区间分桶（用户消费特征） */
    data?: AmountRangeItem[];
    /** 加载中(显示骨架屏) */
    loading?: boolean;
    /** 加载失败(显示错误占位) */
    error?: boolean;
  }

  defineEmits<{ retry: [] }>();

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  // 空判断: 无数据或所有桶都是 0
  const isEmpty = computed(() => {
    if (!props.data || props.data.length === 0) return true;
    return props.data.every((i) => !i.count);
  });

  /** 渲染金额区间柱状图（识别小额高频 / 大额低频） */
  function render(): void {
    if (!props.data || isEmpty.value) return;
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
  <ChartCard
    :empty="isEmpty"
    :error="error"
    :loading="loading"
    min-height="320px"
    skeleton-rows="6"
    @retry="$emit('retry')"
  >
    <template #title>{{ $t('dashboard.analytics.amountRange.title') }}</template>
    <EchartsUI ref="chartRef" class="h-[320px]" />
  </ChartCard>
</template>
