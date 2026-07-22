<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  import ChartCard from '#/components/charts/ChartCard.vue';

  defineOptions({ name: 'AnalysisHourlyDist' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    error: false,
    loading: false,
  });

  interface Props {
    /** 时段日均笔数（长度 24 数组，下标即小时） */
    data?: number[];
    /** 加载中(显示骨架屏) */
    loading?: boolean;
    /** 加载失败(显示错误占位) */
    error?: boolean;
  }

  defineEmits<{ retry: [] }>();

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  // 空判断: 无数据或所有时段都为 0
  const isEmpty = computed(() => {
    if (!props.data || props.data.length === 0) return true;
    return props.data.every((v) => !v);
  });

  /** 渲染时段日均柱状图（识别交易高峰时段，跨多天可对比） */
  function render(): void {
    if (!props.data || isEmpty.value) return;
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
      // 日均笔数: {b}=小时, {c}=日均 count
      tooltip: {
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const hour = p?.axisValue ?? p?.name ?? '';
          const count = p?.data ?? p?.value ?? 0;
          // 日均笔数提示
          return $t('dashboard.analytics.hourlyDist.tooltip', { count, hour });
        },
        trigger: 'axis',
      },
      xAxis: { axisLabel: { fontSize: 11 }, type: 'category', data: hours },
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
    <template #title>{{ $t('dashboard.analytics.hourlyDist.title') }}</template>
    <EchartsUI ref="chartRef" class="h-[320px]" />
  </ChartCard>
</template>
