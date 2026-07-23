<script lang="ts" setup>
  import type { DateRange, DimRankItem } from '../types';

  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { DashboardTradeApi } from '#/api/payment/dashboard/trade-dashboard.api';
  import ChartCard from '#/components/charts/ChartCard.vue';
  import { fenToYuan, formatYuan, toNumber } from '#/utils/pay-amount';

  defineOptions({ name: 'AnalysisDimRank' });

  const props = withDefaults(defineProps<Props>(), {
    dateRange: () => ['', ''],
  });

  interface Props {
    /** 分析页日期区间 */
    dateRange?: DateRange;
  }

  type DimKey = 'app' | 'channelMch' | 'store';

  const activeDim = ref<DimKey>('app');
  const loading = ref(false);
  const error = ref(false);
  const rows = ref<DimRankItem[]>([]);

  const isEmpty = computed(() => rows.value.length === 0);

  const columns = computed(() => [
    { align: 'center' as const, dataIndex: 'rank', title: $t('dashboard.analytics.dimRank.rank'), width: 80 },
    { dataIndex: 'dimName', title: $t('dashboard.analytics.dimRank.name') },
    { align: 'right' as const, dataIndex: 'amount', title: $t('dashboard.analytics.dimRank.amount') },
    { align: 'right' as const, dataIndex: 'orders', title: $t('dashboard.analytics.dimRank.orders') },
    {
      align: 'right' as const,
      dataIndex: 'proportion',
      title: $t('dashboard.analytics.dimRank.proportion'),
      width: 100,
    },
  ]);

  const dataSource = computed(() =>
    rows.value.map((item, i) => ({
      ...item,
      amount: `¥${formatYuan(item.amount)}`,
      dimName: resolveDimName(item),
      orders: item.orders.toLocaleString('en-US'),
      proportion: `${item.proportion}%`,
      rank: i + 1,
    })),
  );

  /** 门店 dimKey 空串时显示「未指定门店」 */
  function resolveDimName(item: DimRankItem): string {
    if (activeDim.value === 'store' && !item.dimKey) {
      // 未指定门店
      return $t('dashboard.analytics.dimRank.unspecifiedStore');
    }
    return item.dimName || item.dimKey || '-';
  }

  async function load() {
    const [start, end] = props.dateRange;
    if (!start || !end) {
      return;
    }
    loading.value = true;
    error.value = false;
    try {
      const { data } = await DashboardTradeApi.dimRank({
        dim: activeDim.value,
        end,
        limit: 10,
        start,
      });
      rows.value = (data ?? []).map((i) => ({
        amount: fenToYuan(i.amount),
        dimKey: i.dimKey ?? '',
        dimName: i.dimName,
        orders: toNumber(i.orders) ?? 0,
        proportion: Number.isFinite(i.proportion) ? (i.proportion as number) : 0,
      }));
    } catch {
      error.value = true;
      rows.value = [];
    } finally {
      loading.value = false;
    }
  }

  watch([() => props.dateRange, activeDim], load, { deep: true, immediate: true });
</script>

<template>
  <ChartCard
    :empty="isEmpty"
    :error="error"
    :loading="loading"
    min-height="200px"
    :skeleton-rows="5"
    @retry="load"
  >
    <template #title>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span>{{ $t('dashboard.analytics.dimRank.title') }}</span>
        <a-radio-group v-model:value="activeDim" button-style="solid" size="small">
          <a-radio-button value="channelMch">{{ $t('dashboard.analytics.dimRank.dim.channelMch') }}</a-radio-button>
          <a-radio-button value="app">{{ $t('dashboard.analytics.dimRank.dim.app') }}</a-radio-button>
          <a-radio-button value="store">{{ $t('dashboard.analytics.dimRank.dim.store') }}</a-radio-button>
        </a-radio-group>
      </div>
    </template>
    <a-table
      :columns="columns"
      :data-source="dataSource"
      :pagination="false"
      row-key="rank"
      size="small"
    />
  </ChartCard>
</template>
