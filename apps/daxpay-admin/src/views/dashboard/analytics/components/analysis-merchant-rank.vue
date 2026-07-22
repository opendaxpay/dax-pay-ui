<script lang="ts" setup>
  import type { MerchantRankItem } from '../types';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import ChartCard from '#/components/charts/ChartCard.vue';
  import { formatYuan } from '#/utils/pay-amount';

  defineOptions({ name: 'AnalysisMerchantRank' });

  const props = withDefaults(defineProps<Props>(), {
    data: () => [],
    error: false,
    loading: false,
  });

  interface Props {
    /** 商户交易额排名 Top10 */
    data?: MerchantRankItem[];
    /** 加载中(显示骨架屏) */
    loading?: boolean;
    /** 加载失败(显示错误占位) */
    error?: boolean;
  }

  defineEmits<{ retry: [] }>();

  const isEmpty = computed(() => !props.data || props.data.length === 0);

  // 表格列定义（排名 / 商户 / 交易额 / 笔数 / 占比）
  const columns = computed(() => [
    { align: 'center' as const, dataIndex: 'rank', title: $t('dashboard.analytics.merchantRank.rank'), width: 80 },
    { dataIndex: 'merchantName', title: $t('dashboard.analytics.merchantRank.merchant') },
    { align: 'right' as const, dataIndex: 'amount', title: $t('dashboard.analytics.merchantRank.amount') },
    { align: 'right' as const, dataIndex: 'orders', title: $t('dashboard.analytics.merchantRank.orders') },
    {
      align: 'right' as const,
      dataIndex: 'proportion',
      title: $t('dashboard.analytics.merchantRank.proportion'),
      width: 100,
    },
  ]);

  // 补排名序号 + 格式化金额/占比为展示文本
  const dataSource = computed(() =>
    (props.data || []).map((item, i) => ({
      ...item,
      amount: `¥${formatYuan(item.amount)}`,
      orders: item.orders.toLocaleString('en-US'),
      proportion: `${item.proportion}%`,
      rank: i + 1,
    })),
  );
</script>

<template>
  <ChartCard
    :empty="isEmpty"
    :error="error"
    :loading="loading"
    min-height="200px"
    skeleton-rows="5"
    @retry="$emit('retry')"
  >
    <template #title>{{ $t('dashboard.analytics.merchantRank.title') }}</template>
    <a-table
      :columns="columns"
      :data-source="dataSource"
      :pagination="false"
      row-key="merchantName"
      size="small"
    />
  </ChartCard>
</template>
