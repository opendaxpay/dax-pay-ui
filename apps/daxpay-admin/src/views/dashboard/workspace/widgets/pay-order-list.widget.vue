<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { NormalOrderApi, type NormalOrderResult } from '#/api/payment/order/normal-order.api';
  import { channelI18nMap } from '#/enums/payment/channelEnum';

  interface Props {
    /** 工作台聚合数据（支付订单独立拉数据，保留以统一 widget props 契约） */
    data?: DashboardData;
  }

  defineOptions({ name: 'PayOrderListWidget' });

  // 支付订单独立拉取数据，不消费聚合统计；保留 data prop 以统一 widget 渲染契约
  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  const router = useRouter();

  const loading = ref(false);
  const orders = ref<NormalOrderResult[]>([]);

  /** 拉取最近支付订单（按创建时间倒序取 20 条） */
  async function load() {
    loading.value = true;
    try {
      const res = await NormalOrderApi.page({ current: 1, size: 20 });
      orders.value = res?.data?.records || [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(load);

  /** 跳转到普通支付订单列表（"更多"按钮） */
  function goAll() {
    router.push({ name: '/trade/pay-order/normal' }).catch(() => {});
  }

  /** 金额分转元 */
  function formatAmount(amount?: number): string {
    if (amount === null || amount === undefined) return '-';
    return (amount / 100).toFixed(2);
  }

  /** 业务状态颜色：复用订单页 bizStatusColor 配置 */
  function statusColor(status?: string): string {
    return status ? $t(`payment.order.bizStatusColor.${status}`) : 'default';
  }

  /** 业务状态文案：复用订单页 bizStatus 配置 */
  function statusLabel(status?: string): string {
    return status ? $t(`payment.order.bizStatus.${status}`) : '-';
  }

  /** 支付通道展示名：channelI18nMap 取 i18n key 再翻译，无映射时降级原 code */
  function channelLabel(channel?: string): string {
    if (!channel) return '-';
    const i18nKey = channelI18nMap[channel];
    if (i18nKey) {
      const text = $t(i18nKey);
      if (text && text !== i18nKey) return text;
    }
    return channel;
  }

  /** 时间格式化：优先支付成功时间，降级创建时间 */
  function fmtTime(order: NormalOrderResult): string {
    const time = order.payTime || order.createTime;
    if (!time) return '-';
    return formatDateTime(time) || '-';
  }
</script>

<template>
  <a-card variant="borderless" class="!h-full min-h-[260px] !bg-card">
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon icon="lucide:receipt-text" class="text-primary size-4" />
        <span>{{ $t('dashboard.workspace.widget.payOrder') }}</span>
      </div>
    </template>
    <template #extra>
      <a-button type="link" size="small" @click="goAll">{{ $t('common.more') }}</a-button>
    </template>

    <a-skeleton v-if="loading" active :paragraph="{ rows: 5 }" />
    <a-empty v-else-if="orders.length === 0" class="!my-6" />
    <!-- 订单列表：固定高度滚动，与左右卡片等高协调 -->
    <ul v-else class="pay-order-scroll flex max-h-[230px] flex-col gap-3 overflow-y-auto pr-1">
      <li v-for="(order, index) in orders" :key="order.id ?? index" class="flex flex-col gap-1">
        <!-- 行1：状态标签 + 标题 + 金额 -->
        <div class="flex items-center gap-2">
          <a-tag :color="statusColor(order.status)" class="!m-0 !shrink-0 text-xs">
            {{ statusLabel(order.status) }}
          </a-tag>
          <span class="text-foreground/80 flex-1 truncate text-sm">{{ order.title || '-' }}</span>
          <span class="text-foreground shrink-0 text-sm font-semibold tabular-nums"
            >¥{{ formatAmount(order.amount) }}</span
          >
        </div>
        <!-- 行2：订单号 · 渠道 · 时间 -->
        <p class="text-foreground/40 truncate text-xs">
          <span>{{ order.orderNo || '-' }}</span>
          <span class="mx-1">·</span>
          <span>{{ channelLabel(order.channel) }}</span>
          <span class="mx-1">·</span>
          <span>{{ fmtTime(order) }}</span>
        </p>
      </li>
    </ul>
  </a-card>
</template>

<style scoped>
  /* 滚动条美化：纤细半透明风格 */
  .pay-order-scroll::-webkit-scrollbar {
    width: 4px;
  }

  .pay-order-scroll::-webkit-scrollbar-thumb {
    background-color: hsl(var(--border));
    border-radius: 2px;
  }

  .pay-order-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
</style>
