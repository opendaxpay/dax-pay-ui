<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { FundFlowApi, type FundFlowQuery, type FundFlowResult } from '#/api/payment/record/fund-flow.api';
  import { BQuery, type QueryField } from '#/components/query';

  defineOptions({ name: 'FundFlowList' });

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const queryForm = ref<FundFlowQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<FundFlowResult[]>([]);

  const drawerVisible = ref(false);
  const detail = ref<FundFlowResult>({});

  // 流水类型选项(前端枚举)
  const flowTypeOptions = computed(() => [
    // 收款
    { label: $t('payment.record.fundFlow.typePay'), value: 'pay' },
    // 退款
    { label: $t('payment.record.fundFlow.typeRefund'), value: 'refund' },
  ]);

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'tradeNo',
      // 资金交易号
      name: $t('payment.order.field.tradeNo'),
      placeholder: $t('payment.order.placeholder.tradeNo'),
    },
    {
      type: 'string',
      field: 'bizOrderNo',
      // 商户订单号
      name: $t('payment.order.field.bizOrderNo'),
      placeholder: $t('payment.order.placeholder.bizOrderNo'),
    },
    {
      type: 'string',
      field: 'refundNo',
      // 退款单号
      name: $t('payment.order.field.refundNo'),
      placeholder: $t('payment.order.placeholder.refundNo'),
    },
    {
      type: 'list',
      field: 'flowType',
      // 流水类型
      name: $t('payment.record.fundFlow.flowType'),
      selectList: flowTypeOptions.value,
    },
    {
      type: 'string',
      field: 'outOrderNo',
      // 通道订单号
      name: $t('payment.order.field.outOrderNo'),
    },
    {
      type: 'string',
      field: 'mchNo',
      name: $t('payment.order.field.merchant'),
    },
  ]);

  function flowTypeLabel(type?: string) {
    if (type === 'pay') return $t('payment.record.fundFlow.typePay');
    if (type === 'refund') return $t('payment.record.fundFlow.typeRefund');
    return type || '-';
  }

  // 金额分转元
  function formatAmount(amount?: number): string {
    if (amount === null || amount === undefined) return '-';
    return (amount / 100).toFixed(2);
  }

  async function queryPage() {
    loading.value = true;
    try {
      const { data } = await FundFlowApi.page({
        ...queryForm.value,
        current: pageConfig.value.currentPage,
        size: pageConfig.value.pageSize,
      });
      tableData.value = data?.records || [];
      pageConfig.value.total = Number(data?.total || 0);
    } finally {
      loading.value = false;
    }
  }

  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  async function handleView(row: FundFlowResult) {
    drawerVisible.value = true;
    detail.value = row;
    if (row.id) {
      const { data } = await FundFlowApi.getById(row.id);
      if (data) {
        detail.value = data;
      }
    }
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column field="tradeNo" :title="$t('payment.order.field.tradeNo')" :min-width="200" show-overflow />
          <vxe-column field="flowType" :title="$t('payment.record.fundFlow.flowType')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="row.flowType === 'pay' ? 'success' : 'warning'">
                {{ flowTypeLabel(row.flowType) }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="bizOrderNo" :title="$t('payment.order.field.bizOrderNo')" :min-width="170" show-overflow />
          <vxe-column field="amount" :title="$t('payment.order.field.amount')" :min-width="110" align="right">
            <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
          </vxe-column>
          <vxe-column field="title" :title="$t('payment.order.field.title')" :min-width="150" show-overflow />
          <vxe-column field="mchName" :title="$t('payment.order.field.merchant')" :min-width="140">
            <template #default="{ row }">
              <div class="flex flex-col">
                <span>{{ row.mchName || row.mchNo || '-' }}</span>
                <span v-if="row.mchNo" class="text-xs text-muted-foreground">{{ row.mchNo }}</span>
              </div>
            </template>
          </vxe-column>
          <vxe-column field="outOrderNo" :title="$t('payment.order.field.outOrderNo')" :min-width="190" show-overflow />
          <vxe-column
            field="finishTime"
            :title="$t('payment.record.fundFlow.finishTime')"
            :min-width="170"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" :width="100" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-button type="link" size="small" @click="handleView(row)">
                {{ $t('common.view') }}
              </a-button>
            </template>
          </vxe-column>
        </vxe-table>
        <vxe-pager
          size="medium"
          :loading="loading"
          :current-page="pageConfig.currentPage"
          :page-size="pageConfig.pageSize"
          :total="pageConfig.total"
          @page-change="
            ({ currentPage, pageSize }) => {
              pageConfig.currentPage = currentPage;
              pageConfig.pageSize = pageSize;
              queryPage();
            }
          "
        />
      </a-card>
    </div>

    <a-drawer v-model:open="drawerVisible" :title="$t('payment.record.fundFlow.detail')" width="640" destroy-on-close>
      <div class="space-y-2 text-sm">
        <div>
          {{ $t('payment.record.fundFlow.flowType') }}:
          <a-tag :color="detail.flowType === 'pay' ? 'success' : 'warning'">
            {{ flowTypeLabel(detail.flowType) }}
          </a-tag>
        </div>
        <div>{{ $t('payment.order.field.tradeNo') }}: {{ detail.tradeNo || '-' }}</div>
        <div v-if="detail.flowType === 'refund'">
          {{ $t('payment.order.field.refundNo') }}: {{ detail.refundNo || '-' }}
        </div>
        <div>{{ $t('payment.order.field.bizOrderNo') }}: {{ detail.bizOrderNo || '-' }}</div>
        <div>{{ $t('payment.order.field.title') }}: {{ detail.title || '-' }}</div>
        <div>{{ $t('payment.order.field.amount') }}: {{ formatAmount(detail.amount) }}</div>
        <div>{{ $t('payment.order.field.currency') }}: {{ detail.currency || '-' }}</div>
        <div>{{ $t('payment.order.field.channel') }}: {{ detail.channel || '-' }}</div>
        <div>{{ $t('payment.order.field.provider') }}: {{ detail.provider || '-' }}</div>
        <div>{{ $t('payment.order.field.outOrderNo') }}: {{ detail.outOrderNo || '-' }}</div>
        <div>
          {{ $t('payment.record.fundFlow.finishTime') }}:
          {{ formatDateTime(detail.finishTime) || '-' }}
        </div>
      </div>
    </a-drawer>
  </div>
</template>
