<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { computed, onMounted, ref, watch } from 'vue';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  import { DashboardTradeApi, type TradeOverviewResult } from '#/api/payment/dashboard/trade-dashboard.api';

  interface Props {
    /** 工作台聚合数据（交易概览独立拉数据，保留以统一 widget props 契约） */
    data?: DashboardData;
  }

  defineOptions({ name: 'TradeOverviewWidget' });

  // 交易概览独立拉取数据，不消费聚合统计；保留 data prop 以统一 widget 渲染契约
  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  // 今日 / 昨日 tab 切换
  const activeTab = ref<'today' | 'yesterday'>('today');

  const loading = ref(false);
  const overview = ref<TradeOverviewResult>({});

  /** 拉取指定日期的概览统计 */
  async function load() {
    loading.value = true;
    try {
      const res = await DashboardTradeApi.overview({ date: activeTab.value });
      overview.value = res?.data || {};
    } finally {
      loading.value = false;
    }
  }

  // tab 切换时重新拉取
  watch(activeTab, load);
  onMounted(load);

  /** 金额分转元(千分位 + 2 位小数), null/undefined 显示 '-' */
  function formatAmount(fen?: number): string {
    if (fen === null || fen === undefined) return '-';
    return (fen / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /** 数值千分位格式化 */
  function formatCount(count?: number): string {
    if (count === null || count === undefined) return '-';
    return count.toLocaleString('en-US');
  }

  const successAmount = computed(() => formatAmount(overview.value.successAmount));
  const successCount = computed(() => formatCount(overview.value.successCount));
  const refundAmount = computed(() => formatAmount(overview.value.refundAmount));
  const refundCount = computed(() => formatCount(overview.value.refundCount));
</script>

<template>
  <a-card variant="borderless" class="!h-full min-h-[260px] !bg-card">
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon icon="lucide:wallet" class="text-primary size-4" />
        <span>{{ $t('dashboard.workspace.widget.tradeOverview') }}</span>
      </div>
    </template>
    <template #extra>
      <a-radio-group v-model:value="activeTab" button-style="solid" size="small">
        <a-radio-button value="today">{{ $t('dashboard.workspace.tradeOverview.today') }}</a-radio-button>
        <a-radio-button value="yesterday">{{ $t('dashboard.workspace.tradeOverview.yesterday') }}</a-radio-button>
      </a-radio-group>
    </template>

    <a-skeleton v-if="loading" active :paragraph="{ rows: 3 }" />
    <!-- 主指标 + 副指标：垂直分布，主指标贴顶、副指标贴底，等高无空白 -->
    <div v-else class="flex h-full flex-col justify-between">
      <div>
        <p class="text-foreground/60 text-sm">{{ $t('dashboard.workspace.tradeOverview.successAmount') }}</p>
        <p class="text-primary mt-1 text-[40px] font-semibold leading-none tabular-nums">
          {{ successAmount }}
        </p>
      </div>

      <!-- 副指标行：成交笔数 / 退款金额 / 退款笔数，三列平分 -->
      <div class="mt-8 flex justify-between">
        <div>
          <p class="text-foreground/50 text-xs">{{ $t('dashboard.workspace.tradeOverview.successCount') }}</p>
          <span class="text-foreground mt-1 block text-lg font-semibold tabular-nums">{{ successCount }}</span>
        </div>
        <div>
          <p class="text-foreground/50 text-xs">{{ $t('dashboard.workspace.tradeOverview.refundAmount') }}</p>
          <span class="text-foreground mt-1 block text-lg font-semibold tabular-nums">{{ refundAmount }}</span>
        </div>
        <div>
          <p class="text-foreground/50 text-xs">{{ $t('dashboard.workspace.tradeOverview.refundCount') }}</p>
          <span class="text-foreground mt-1 block text-lg font-semibold tabular-nums">{{ refundCount }}</span>
        </div>
      </div>
    </div>
  </a-card>
</template>
