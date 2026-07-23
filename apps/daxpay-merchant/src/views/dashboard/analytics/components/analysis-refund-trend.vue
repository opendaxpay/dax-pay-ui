<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  import ChartCard from '#/components/charts/ChartCard.vue';
  import { formatYuan } from '#/utils/pay-amount';

  defineOptions({ name: 'AnalysisRefundTrend' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    error: false,
    loading: false,
  });

  interface Props {
    /** 退款趋势（日期 + 退款额 + 笔数） */
    data?: { amounts: number[]; counts: number[]; dates: string[] };
    /** 加载中(显示骨架屏) */
    loading?: boolean;
    /** 加载失败(显示错误占位) */
    error?: boolean;
  }

  defineEmits<{ retry: [] }>();

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  // 空判断: 无日期或所有退款笔数都是 0（按笔数，避免小额被当成空）
  const isEmpty = computed(() => {
    if (!props.data || props.data.dates.length === 0) return true;
    return (props.data.counts ?? []).every((v) => !v);
  });

  /** 渲染退款额折线图（带面积渐变） */
  function render(): void {
    if (!props.data || isEmpty.value) return;
    renderEcharts({
      grid: { bottom: '8%', containLabel: true, left: '3%', right: '4%', top: '10%' },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (val: any) => `¥${formatYuan(Number(val))}`,
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
  <ChartCard
    :empty="isEmpty"
    :error="error"
    :loading="loading"
    min-height="320px"
    :skeleton-rows="6"
    @retry="$emit('retry')"
  >
    <template #title>{{ $t('dashboard.analytics.refundTrend.title') }}</template>
    <EchartsUI ref="chartRef" class="h-[320px]" />
  </ChartCard>
</template>
