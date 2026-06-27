<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { computed, ref } from 'vue';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  interface Props {
    /** 工作台聚合数据（交易概览暂无后端 API，保留以统一 widget props 契约） */
    data?: DashboardData;
  }

  defineOptions({ name: 'TradeOverviewWidget' });

  // 交易概览暂无后端 API，保留 data prop 以统一 widget 渲染契约
  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  // 今日 / 昨日 tab 切换
  const activeTab = ref<'today' | 'yesterday'>('today');

  // Mock 数据：后端交易聚合 API 就绪后替换为真实数据
  // 成交金额（元）/ 成交笔数 / 退款金额（元）/ 退款笔数
  const mockData = {
    today: {
      successAmount: '128,560.50',
      refundAmount: '1,280.00',
      refundCount: 8,
      successCount: 326,
    },
    yesterday: {
      successAmount: '112,380.20',
      refundAmount: '980.50',
      refundCount: 6,
      successCount: 289,
    },
  } as const;

  // 当前展示数据（随 tab 切换）
  const overview = computed(() => mockData[activeTab.value]);
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

    <!-- 主指标 + 副指标：垂直分布，主指标贴顶、副指标贴底，等高无空白 -->
    <div class="flex h-full flex-col justify-between">
      <div>
        <p class="text-foreground/60 text-sm">{{ $t('dashboard.workspace.tradeOverview.successAmount') }}</p>
        <p class="text-primary mt-1 text-[40px] font-semibold leading-none tabular-nums">
          {{ overview.successAmount }}
        </p>
      </div>

      <!-- 副指标行：成交笔数 / 退款金额 / 退款笔数，三列平分 -->
      <div class="mt-8 flex justify-between">
        <div>
          <p class="text-foreground/50 text-xs">{{ $t('dashboard.workspace.tradeOverview.successCount') }}</p>
          <span class="text-foreground mt-1 block text-lg font-semibold tabular-nums">{{ overview.successCount }}</span>
        </div>
        <div>
          <p class="text-foreground/50 text-xs">{{ $t('dashboard.workspace.tradeOverview.refundAmount') }}</p>
          <span class="text-foreground mt-1 block text-lg font-semibold tabular-nums">{{ overview.refundAmount }}</span>
        </div>
        <div>
          <p class="text-foreground/50 text-xs">{{ $t('dashboard.workspace.tradeOverview.refundCount') }}</p>
          <span class="text-foreground mt-1 block text-lg font-semibold tabular-nums">{{ overview.refundCount }}</span>
        </div>
      </div>
    </div>
  </a-card>
</template>
