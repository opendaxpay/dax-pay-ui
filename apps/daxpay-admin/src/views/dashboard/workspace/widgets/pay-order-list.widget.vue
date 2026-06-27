<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  import { useMessage } from '#/hooks/useMessage';

  interface Props {
    /** 工作台聚合数据（支付订单暂无后端 API，保留以统一 widget props 契约） */
    data?: DashboardData;
  }

  defineOptions({ name: 'PayOrderListWidget' });

  // 支付订单暂无后端 API，保留 data prop 以统一 widget 渲染契约
  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  const { message } = useMessage();

  // 订单状态枚举
  type OrderStatus = 'closed' | 'fail' | 'success';

  interface MockOrder {
    // 订单号
    orderNo: string;
    // 商品标题
    title: string;
    // 金额（元）
    amount: string;
    // 状态
    status: OrderStatus;
    // 支付渠道 code（对应 payment.channel.common.*）
    channel: string;
    // 时间（mock 字符串，直接展示）
    time: string;
  }

  // 订单标题模板池
  const titlePool = [
    '会员包年套餐',
    '商品购买',
    'VIP月卡续费',
    '电子书-架构之道',
    '课程订阅-进阶',
    '实物商品-配件',
    '软件授权-年度',
    '礼品卡充值',
    '直播打赏',
    '云服务-包月',
  ];
  const channelPool = ['wechat', 'alipay', 'unionPay'];
  // 状态权重：success 出现概率更高
  const statusPool: OrderStatus[] = ['success', 'success', 'success', 'fail', 'closed'];
  const amountPool = ['299.00', '59.90', '19.90', '45.00', '199.00', '128.00', '88.88', '599.00', '36.50', '1080.00'];

  // 生成 20 条 mock 订单数据（后端支付订单管理 API 就绪后替换为真实请求结果）
  const mockOrders: MockOrder[] = Array.from({ length: 20 }).map((_, i) => {
    // 日期从 06-27 往前推，每 4 条一天
    const day = String(27 - Math.floor(i / 4)).padStart(2, '0');
    const hour = String(8 + (i % 14)).padStart(2, '0');
    const min = String((i * 13) % 60).padStart(2, '0');
    const seq = String(1001 + i);
    return {
      orderNo: `PAY202606${day}${hour}${min}${seq}`,
      title: i >= titlePool.length ? `${titlePool[i % titlePool.length]!} #${seq}` : titlePool[i]!,
      amount: amountPool[i % amountPool.length]!,
      status: statusPool[i % statusPool.length]!,
      channel: channelPool[i % channelPool.length]!,
      time: `2026-06-${day} ${hour}:${min}`,
    } as MockOrder;
  });

  /** 订单状态 → a-tag color 映射 */
  function statusColor(status: OrderStatus): string {
    if (status === 'success') return 'green';
    if (status === 'fail') return 'red';
    return 'default';
  }

  /** 订单状态 → i18n key */
  function statusLabel(status: OrderStatus): string {
    return $t(`dashboard.workspace.payOrder.status.${status}`);
  }

  /** "更多"按钮：支付订单管理页尚未开发，提示开发中 */
  function handleMore() {
    message.info($t('dashboard.workspace.payOrder.developing'));
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
      <a-button type="link" size="small" @click="handleMore">{{ $t('common.more') }}</a-button>
    </template>

    <!-- 订单列表：固定高度滚动，与左右卡片等高协调 -->
    <ul class="pay-order-scroll flex max-h-[230px] flex-col gap-3 overflow-y-auto pr-1">
      <li v-for="(order, index) in mockOrders" :key="index" class="flex flex-col gap-1">
        <!-- 行1：状态标签 + 标题 + 金额 -->
        <div class="flex items-center gap-2">
          <a-tag :color="statusColor(order.status)" class="!m-0 !shrink-0 text-xs">
            {{ statusLabel(order.status) }}
          </a-tag>
          <span class="text-foreground/80 flex-1 truncate text-sm">{{ order.title }}</span>
          <span class="text-foreground shrink-0 text-sm font-semibold tabular-nums">¥{{ order.amount }}</span>
        </div>
        <!-- 行2：订单号 · 渠道 · 时间 -->
        <p class="text-foreground/40 truncate text-xs">
          <span>{{ order.orderNo }}</span>
          <span class="mx-1">·</span>
          <span>{{ $t(`payment.channel.common.${order.channel}`) }}</span>
          <span class="mx-1">·</span>
          <span>{{ order.time }}</span>
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
