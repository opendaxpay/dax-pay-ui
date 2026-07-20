<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { PayTradeApi, type PayTradeResult } from '#/api/payment/order/pay-trade.api';

  interface Props {
    /** 工作台聚合数据（资金交易独立拉数据，保留以统一 widget props 契约） */
    data?: DashboardData;
  }

  defineOptions({ name: 'PayTradeListWidget' });

  // 资金交易独立拉取数据，不消费聚合统计；保留 data prop 以统一 widget 渲染契约
  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  const router = useRouter();

  const loading = ref(false);
  const trades = ref<PayTradeResult[]>([]);

  /** 拉取最近资金交易（按创建时间倒序取 20 条） */
  async function load() {
    loading.value = true;
    try {
      const res = await PayTradeApi.page({ current: 1, size: 20 });
      trades.value = res?.data?.records || [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(load);

  /** 跳转到资金交易列表（"更多"按钮） */
  function goAll() {
    router.push({ name: '/trade/pay-trade' }).catch(() => {});
  }

  /** 金额分转元 */
  function formatAmount(amount?: number): string {
    if (amount === null || amount === undefined) return '-';
    return (amount / 100).toFixed(2);
  }

  /** 资金状态颜色：复用资金交易页 fundStatusColor 配置 */
  function statusColor(status?: string): string {
    return status ? $t(`payment.order.fundStatusColor.${status}`) : 'default';
  }

  /** 资金状态文案：复用资金交易页 fundStatus 配置 */
  function statusLabel(status?: string): string {
    return status ? $t(`payment.order.fundStatus.${status}`) : '-';
  }

  /** 时间格式化：优先支付成功时间，降级创建时间 */
  function fmtTime(trade: PayTradeResult): string {
    const time = trade.payTime || trade.createTime;
    if (!time) return '-';
    return formatDateTime(time) || '-';
  }
</script>

<template>
  <a-card variant="borderless" class="!h-full min-h-[260px] !bg-card">
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon icon="lucide:arrow-left-right" class="text-primary size-4" />
        <span>{{ $t('dashboard.workspace.widget.payTrade') }}</span>
      </div>
    </template>
    <template #extra>
      <a-button type="link" size="small" @click="goAll">{{ $t('common.more') }}</a-button>
    </template>

    <a-skeleton v-if="loading" active :paragraph="{ rows: 5 }" />
    <a-empty v-else-if="trades.length === 0" class="!my-6" />
    <!-- 资金交易列表：固定高度滚动，与左右卡片等高协调 -->
    <ul v-else class="pay-trade-scroll flex max-h-[230px] flex-col gap-3 overflow-y-auto pr-1">
      <li v-for="(trade, index) in trades" :key="trade.id ?? index" class="flex flex-col gap-1">
        <!-- 行1：状态标签 + 标题 + 金额 -->
        <div class="flex items-center gap-2">
          <a-tag :color="statusColor(trade.status)" class="!m-0 !shrink-0 text-xs">
            {{ statusLabel(trade.status) }}
          </a-tag>
          <span class="text-foreground/80 flex-1 truncate text-sm">{{ trade.title || '-' }}</span>
          <span class="text-foreground shrink-0 text-sm font-semibold tabular-nums"
            >¥{{ formatAmount(trade.amount) }}</span
          >
        </div>
        <!-- 行2：交易号 · 时间（列表场景不展示通道，详情才有完整通道信息） -->
        <p class="text-foreground/40 truncate text-xs">
          <span>{{ trade.tradeNo || '-' }}</span>
          <span class="mx-1">·</span>
          <span>{{ fmtTime(trade) }}</span>
        </p>
      </li>
    </ul>
  </a-card>
</template>

<style scoped>
  /* 滚动条美化：纤细半透明风格 */
  .pay-trade-scroll::-webkit-scrollbar {
    width: 4px;
  }

  .pay-trade-scroll::-webkit-scrollbar-thumb {
    background-color: hsl(var(--border));
    border-radius: 2px;
  }

  .pay-trade-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
</style>
