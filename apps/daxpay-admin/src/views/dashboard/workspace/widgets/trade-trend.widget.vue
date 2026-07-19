<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { nextTick, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { IconifyIcon } from '@vben/icons';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  import { DashboardTradeApi, type TradeTrendItemResult } from '#/api/payment/dashboard/trade-dashboard.api';

  interface Props {
    /** 工作台聚合数据（交易趋势独立拉数据，保留以统一 widget props 契约） */
    data?: DashboardData;
  }

  defineOptions({ name: 'TradeTrendWidget' });

  // 交易趋势独立拉取数据，不消费聚合统计；保留 data prop 以统一 widget 渲染契约
  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  // 趋势时间跨度切换
  type TrendRange = '7days' | '30days';
  const activeRange = ref<TrendRange>('7days');

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  const loading = ref(false);
  const error = ref(false);
  const trendData = ref<TradeTrendItemResult[]>([]);

  /** 拉取指定天数的交易趋势 */
  async function load() {
    loading.value = true;
    error.value = false;
    try {
      const days = activeRange.value === '7days' ? 7 : 30;
      const res = await DashboardTradeApi.trend({ days });
      trendData.value = res?.data || [];
    } catch (e) {
      error.value = true;
      trendData.value = [];
    } finally {
      loading.value = false;
      // 首次从骨架屏切到 EchartsUI 需等 DOM 挂载后再渲染
      await nextTick();
      render();
    }
  }

  /** 按当前数据渲染折线图 */
  function render(): void {
    // 日期截取 MM-DD 作为 x 轴; 金额分转元
    const labels = trendData.value.map((i) => i.date?.slice(5) || '');
    const amounts = trendData.value.map((i) => Math.round((i.amount ?? 0) / 100));
    renderEcharts({
      grid: { bottom: '8%', containLabel: true, left: '3%', right: '4%', top: '10%' },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (val: any) => `¥${Number(val).toLocaleString('en-US')}`,
      },
      xAxis: {
        axisLabel: { fontSize: 11 },
        boundaryGap: false,
        type: 'category',
        data: labels,
      },
      yAxis: {
        axisLabel: { fontSize: 11 },
        type: 'value',
      },
      series: [
        {
          areaStyle: { opacity: 0.15 },
          data: amounts,
          smooth: true,
          type: 'line',
        },
      ],
    });
  }

  // tab 切换时重新拉取
  watch(activeRange, load);

  onMounted(load);
</script>

<template>
  <a-card variant="borderless" class="!h-full min-h-[260px] !bg-card">
    <template #title>
      <div class="flex items-center gap-2">
        <span>{{ $t('dashboard.workspace.widget.tradeTrend') }}</span>
      </div>
    </template>
    <template #extra>
      <a-radio-group v-model:value="activeRange" button-style="solid" size="small">
        <a-radio-button value="7days">{{ $t('dashboard.workspace.tradeTrend.last7days') }}</a-radio-button>
        <a-radio-button value="30days">{{ $t('dashboard.workspace.tradeTrend.last30days') }}</a-radio-button>
      </a-radio-group>
    </template>

    <a-skeleton v-if="loading && trendData.length === 0" active :paragraph="{ rows: 5 }" />
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center gap-2 py-8"
    >
      <IconifyIcon icon="ant-design:warning-outlined" class="text-foreground/40 size-8" />
      <p class="text-foreground/60 text-sm">{{ $t('common.loadFailed') }}</p>
      <a-button size="small" type="primary" @click="load">{{ $t('common.retry') }}</a-button>
    </div>
    <a-empty
      v-else-if="trendData.length === 0 || trendData.every((i) => (i.amount ?? 0) === 0)"
      class="!my-10"
    />
    <EchartsUI v-else ref="chartRef" class="h-[280px]" />
  </a-card>
</template>
