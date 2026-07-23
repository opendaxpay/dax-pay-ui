<script lang="ts" setup>
  import type { ChannelSuccessItem } from '../types';

  import { computed, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  import ChartCard from '#/components/charts/ChartCard.vue';

  defineOptions({ name: 'AnalysisChannelSuccess' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    error: false,
    loading: false,
  });

  interface Props {
    /** 各支付渠道成功率（横向对比，一眼看出渠道质量差异） */
    data?: ChannelSuccessItem[];
    /** 加载中(显示骨架屏) */
    loading?: boolean;
    /** 加载失败(显示错误占位) */
    error?: boolean;
  }

  defineEmits<{ retry: [] }>();

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  const isEmpty = computed(() => !props.data || props.data.length === 0);

  /** 渲染横向柱状图（Y轴渠道名，X轴成功率% 固定 0–100，避免 min=90 导致低成功率柱不可见） */
  function render(): void {
    if (!props.data || isEmpty.value) return;
    renderEcharts({
      grid: { bottom: '3%', containLabel: true, left: '3%', right: '12%', top: '5%' },
      series: [
        {
          barMaxWidth: 28,
          barWidth: '55%',
          data: props.data.map((i) => i.rate),
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          // 成功率标签: 右侧显示具体百分比
          label: { formatter: '{c}%', position: 'right', show: true },
          type: 'bar',
        },
      ],
      tooltip: { formatter: '{b}: {c}%', trigger: 'axis' },
      xAxis: {
        axisLabel: { fontSize: 11, formatter: '{value}%' },
        // 固定 0–100: 原先 min:90 会让 <90% 的柱完全消失, ≥90% 的柱只剩细缝, 观感像空图
        max: 100,
        min: 0,
        type: 'value',
      },
      yAxis: {
        axisLabel: { fontSize: 11 },
        type: 'category',
        data: props.data.map((i) => i.name),
      },
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
    <template #title>{{ $t('dashboard.analytics.channelSuccess.title') }}</template>
    <EchartsUI ref="chartRef" class="h-[320px]" />
  </ChartCard>
</template>
