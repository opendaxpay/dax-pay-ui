<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  interface Props {
    /** 工作台聚合数据（支付方式分布暂无后端 API，保留以统一 widget props 契约） */
    data?: DashboardData;
  }

  defineOptions({ name: 'ChannelDistributionWidget' });

  // 支付方式分布暂无后端 API，保留 data prop 以统一 widget 渲染契约
  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  onMounted(() => {
    // Mock 数据：各支付方式占比（百分比）
    // 后端支付方式分布 API 就绪后替换为真实请求结果
    renderEcharts({
      legend: { bottom: 0, orient: 'horizontal' },
      series: [
        {
          label: { formatter: '{d}%', show: true },
          radius: ['45%', '70%'],
          type: 'pie',
          data: [
            { name: $t('payment.channel.common.wechat'), value: 38 },
            { name: $t('payment.channel.common.alipay'), value: 28 },
            { name: $t('payment.channel.common.unionPay'), value: 18 },
            { name: $t('payment.channel.common.visa'), value: 8 },
            { name: $t('payment.channel.common.mastercard'), value: 5 },
            { name: $t('payment.channel.common.douyin'), value: 3 },
          ],
        },
      ],
      tooltip: { trigger: 'item' },
    });
  });
</script>

<template>
  <a-card variant="borderless" class="!h-full min-h-[260px] !bg-card">
    <template #title>
      <div class="flex items-center gap-2">
        <span>{{ $t('dashboard.workspace.widget.channelDist') }}</span>
      </div>
    </template>

    <EchartsUI ref="chartRef" class="h-[280px]" />
  </a-card>
</template>
