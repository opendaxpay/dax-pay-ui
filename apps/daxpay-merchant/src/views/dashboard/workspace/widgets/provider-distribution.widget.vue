<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { nextTick, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { IconifyIcon } from '@vben/icons';
  import { EchartsUI, type EchartsUIType, useEcharts } from '@vben/plugins/echarts';

  import { DashboardTradeApi, type ProviderDistItemResult } from '#/api/payment/dashboard/trade-dashboard.api';
  import { providerI18nMap } from '#/enums/payment/providerEnum';
  import { fenToYuan, formatYuan, toNumber } from '#/utils/pay-amount';

  interface Props {
    /** 工作台聚合数据（支付渠道分布独立拉数据，保留以统一 widget props 契约） */
    data?: DashboardData;
  }

  defineOptions({ name: 'ProviderDistributionWidget' });

  // 支付渠道分布独立拉取数据，不消费聚合统计；保留 data prop 以统一 widget 渲染契约
  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  const chartRef = ref<EchartsUIType>();
  const { renderEcharts } = useEcharts(chartRef);

  const loading = ref(false);
  const error = ref(false);
  const distData = ref<ProviderDistItemResult[]>([]);

  /** 支付渠道编码 → 展示名: 优先 i18n 映射, 无映射时降级原编码 */
  function providerLabel(provider?: string): string {
    if (!provider) return '-';
    const i18nKey = providerI18nMap[provider];
    if (i18nKey) {
      const text = $t(i18nKey);
      if (text && text !== i18nKey) return text;
    }
    return provider;
  }

  /** 拉取近 30 天支付渠道分布 */
  async function load() {
    loading.value = true;
    error.value = false;
    try {
      const res = await DashboardTradeApi.providerDist({ days: 30 });
      distData.value = res?.data || [];
    } catch (e) {
      error.value = true;
      distData.value = [];
    } finally {
      loading.value = false;
      await nextTick();
      render();
    }
  }

  /** 渲染饼图 */
  function render(): void {
    const data = distData.value.map((i) => ({
      name: providerLabel(i.provider),
      // 金额分转元(保留 2 位小数; 占比按 value 相对计算)
      value: fenToYuan(i.amount),
    }));
    renderEcharts({
      legend: { bottom: 0, orient: 'horizontal' },
      series: [
        {
          label: { formatter: '{d}%', show: true },
          radius: ['45%', '70%'],
          type: 'pie',
          data,
        },
      ],
      tooltip: {
        trigger: 'item',
        valueFormatter: (val: any) => `¥${formatYuan(Number(val))}`,
      },
    });
  }

  onMounted(load);
</script>

<template>
  <a-card variant="borderless" class="!h-full min-h-[260px] !bg-card">
    <template #title>
      <div class="flex items-center gap-2">
        <span>{{ $t('dashboard.workspace.widget.providerDist') }}</span>
      </div>
    </template>

    <a-skeleton v-if="loading && distData.length === 0" active :paragraph="{ rows: 5 }" />
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center gap-2 py-8"
    >
      <IconifyIcon icon="ant-design:warning-outlined" class="text-foreground/40 size-8" />
      <p class="text-foreground/60 text-sm">{{ $t('common.loadFailed') }}</p>
      <a-button size="small" type="primary" @click="load">{{ $t('common.retry') }}</a-button>
    </div>
    <a-empty v-else-if="distData.length === 0 || distData.every((i) => (toNumber(i.count) ?? 0) === 0)" class="!my-10" />
    <EchartsUI v-else ref="chartRef" class="h-[280px]" />
  </a-card>
</template>
