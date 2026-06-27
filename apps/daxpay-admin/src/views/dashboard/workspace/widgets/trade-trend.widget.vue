<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  interface Props {
    /** 工作台聚合数据（交易趋势暂无后端 API，保留以统一 widget props 契约） */
    data?: DashboardData;
  }

  defineOptions({ name: 'TradeTrendWidget' });

  // 交易趋势暂无后端 API，保留 data prop 以统一 widget 渲染契约
  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  // 趋势时间跨度切换
  type TrendRange = '7days' | '30days';
  const activeRange = ref<TrendRange>('7days');

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  // Mock 数据：近 7 天 / 近 30 天交易额（元）
  // 后端交易聚合 API 就绪后替换为真实请求结果
  const mockSeries: Record<TrendRange, number[]> = {
    '7days': [8200, 9320, 9010, 9340, 12_900, 13_300, 13_200],
    '30days': [
      5200, 6100, 5800, 6700, 7200, 6900, 7800, 8200, 7600, 8400, 9100, 8800, 9600, 10_200, 9800, 10_800, 11_500,
      11_200, 12_300, 12_800, 11_900, 13_200, 12_900, 13_800, 14_500, 14_200, 15_300, 15_800, 14_900, 16_200,
    ],
  };

  // 近 7 天 x 轴标签（周一~周日）
  const weekLabels: string[] = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  // 近 30 天 x 轴标签（MM-DD，从今天倒推）
  const monthLabels: string[] = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}-${dd}`;
  });

  /** 按当前时间跨度渲染折线图 */
  function render(): void {
    const isWeek = activeRange.value === '7days';
    renderEcharts({
      grid: { bottom: '8%', containLabel: true, left: '3%', right: '4%', top: '10%' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        axisLabel: { fontSize: 11 },
        boundaryGap: false,
        type: 'category',
        data: isWeek ? weekLabels : monthLabels,
      },
      yAxis: {
        axisLabel: { fontSize: 11 },
        type: 'value',
      },
      series: [
        {
          areaStyle: { opacity: 0.15 },
          data: mockSeries[activeRange.value],
          smooth: true,
          type: 'line',
        },
      ],
    });
  }

  // tab 切换时重渲染
  watch(activeRange, render);

  onMounted(render);
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

    <EchartsUI ref="chartRef" class="h-[280px]" />
  </a-card>
</template>
