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
  const error = ref(false);
  const overview = ref<TradeOverviewResult>({});

  /** 拉取指定日期的概览统计 */
  async function load() {
    loading.value = true;
    error.value = false;
    try {
      const res = await DashboardTradeApi.overview({ date: activeTab.value });
      overview.value = res?.data || {};
    } catch (e) {
      error.value = true;
      overview.value = {};
    } finally {
      loading.value = false;
    }
  }

  // tab 切换时重新拉取
  watch(activeTab, load);
  onMounted(load);

  /** 金额分→元(用于 StatCard, 0 显示 ¥0 灰色, undefined 显示 —) */
  const successAmountYuan = computed(() =>
    overview.value.successAmount === undefined ? undefined : Math.round(overview.value.successAmount / 100),
  );
  const refundAmountYuan = computed(() =>
    overview.value.refundAmount === undefined ? undefined : Math.round(overview.value.refundAmount / 100),
  );
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
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center gap-2 py-8"
    >
      <IconifyIcon icon="ant-design:warning-outlined" class="text-foreground/40 size-8" />
      <p class="text-foreground/60 text-sm">{{ $t('common.loadFailed') }}</p>
      <a-button size="small" type="primary" @click="load">{{ $t('common.retry') }}</a-button>
    </div>
    <!-- 主指标 + 副指标：垂直分布，主指标贴顶、副指标贴底，等高无空白 -->
    <div v-else class="flex h-full flex-col justify-between">
      <div>
        <p class="text-foreground/60 text-sm">{{ $t('dashboard.workspace.tradeOverview.successAmount') }}</p>
        <p
          class="mt-1 text-[40px] font-semibold leading-none tabular-nums"
          :class="successAmountYuan === 0 ? 'text-foreground/40' : 'text-primary'"
        >
          <span v-if="successAmountYuan === undefined">—</span>
          <template v-else>
            <span class="mr-0.5 text-base">¥</span>
            {{ successAmountYuan.toLocaleString('en-US') }}
          </template>
        </p>
      </div>

      <!-- 副指标行：成交笔数 / 退款金额 / 退款笔数，三列平分 -->
      <div class="mt-8 flex justify-between">
        <div>
          <p class="text-foreground/50 text-xs">{{ $t('dashboard.workspace.tradeOverview.successCount') }}</p>
          <span
            class="text-foreground mt-1 block text-lg font-semibold tabular-nums"
            :class="overview.successCount === 0 ? 'text-foreground/40' : ''"
          >
            {{ overview.successCount === undefined ? '—' : overview.successCount.toLocaleString('en-US') }}
          </span>
        </div>
        <div>
          <p class="text-foreground/50 text-xs">{{ $t('dashboard.workspace.tradeOverview.refundAmount') }}</p>
          <span
            class="text-foreground mt-1 block text-lg font-semibold tabular-nums"
            :class="refundAmountYuan === 0 ? 'text-foreground/40' : ''"
          >
            <template v-if="refundAmountYuan === undefined">—</template>
            <template v-else>¥{{ refundAmountYuan.toLocaleString('en-US') }}</template>
          </span>
        </div>
        <div>
          <p class="text-foreground/50 text-xs">{{ $t('dashboard.workspace.tradeOverview.refundCount') }}</p>
          <span
            class="text-foreground mt-1 block text-lg font-semibold tabular-nums"
            :class="overview.refundCount === 0 ? 'text-foreground/40' : ''"
          >
            {{ overview.refundCount === undefined ? '—' : overview.refundCount.toLocaleString('en-US') }}
          </span>
        </div>
      </div>
    </div>
  </a-card>
</template>
