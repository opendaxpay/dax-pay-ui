<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { TransferApi, type TransferTradeQuery, type TransferTradeResult } from '#/api/payment/transfer/transfer.api';
  import { BQuery, type QueryField } from '#/components/query';
  defineOptions({ name: 'TransferTradeList' });

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  const queryForm = ref<TransferTradeQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<TransferTradeResult[]>([]);

  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<TransferTradeResult>({});

  // 转账状态
  const statusOptions = computed(() =>
    ['processing', 'success', 'fail', 'close'].map((v) => ({
      label: $t(`payment.transfer.status.${v}`),
      value: v,
    })),
  );

  // 所属通道
  const channelOptions = computed(() =>
    ['wechat', 'alipay', 'douyin'].map((v) => ({
      label: $t(`payment.transfer.channel.${v}`),
      value: v,
    })),
  );

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'tradeNo',
      name: $t('payment.transfer.field.tradeNo'),
    },
    {
      type: 'list',
      field: 'containerChannel',
      name: $t('payment.transfer.field.containerChannel'),
      selectList: channelOptions.value,
    },
    {
      type: 'list',
      field: 'status',
      name: $t('payment.transfer.field.status'),
      selectList: statusOptions.value,
    },
    {
      type: 'date_time_range',
      field: 'createTime',
      name: $t('payment.transfer.field.createTime'),
      startField: 'createTimeStart',
      endField: 'createTimeEnd',
    },
  ]);

  function queryPage() {
    loading.value = true;
    return TransferApi.tradePage({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res) => {
        tableData.value = res.data?.records || [];
        pageConfig.value.total = Number(res.data?.total) || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  function handlePageChange({ currentPage, pageSize }: { currentPage: number; pageSize: number }) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  function formatAmount(amount?: number): string {
    if (amount === null || amount === undefined) return '-';
    return (amount / 100).toFixed(2);
  }

  function statusColor(status?: string): string {
    return status ? $t(`payment.transfer.statusColor.${status}`) : 'default';
  }

  async function handleView(row: TransferTradeResult) {
    drawerVisible.value = true;
    drawerLoading.value = true;
    try {
      const { data } = await TransferApi.tradeGetById(row.id!);
      detail.value = data || {};
    } finally {
      drawerLoading.value = false;
    }
  }

  function handleDrawerClose() {
    drawerVisible.value = false;
    detail.value = {};
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <div class="mb-3 text-lg font-medium">{{ $t('menu.trade.transfer.trade') }}</div>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column field="tradeNo" :title="$t('payment.transfer.field.tradeNo')" :min-width="190" show-overflow />
          <vxe-column field="containerChannel" :title="$t('payment.transfer.field.containerChannel')" :min-width="110">
            <template #default="{ row }">
              {{ row.containerChannel ? $t(`payment.transfer.channel.${row.containerChannel}`) : '-' }}
            </template>
          </vxe-column>
          <vxe-column field="amount" :title="$t('payment.transfer.field.amount')" :min-width="110" align="right">
            <template #default="{ row }">
              {{ formatAmount(row.amount) }}
            </template>
          </vxe-column>
          <vxe-column field="status" :title="$t('payment.transfer.field.status')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.status)">
                {{ $t(`payment.transfer.status.${row.status}`) }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="mchName" :title="$t('payment.transfer.field.merchant')" :min-width="150">
            <template #default="{ row }">
              <div class="flex flex-col">
                <span>{{ row.mchName || row.mchNo || '-' }}</span>
                <span v-if="row.mchNo" class="text-xs text-muted-foreground">{{ row.mchNo }}</span>
              </div>
            </template>
          </vxe-column>
          <vxe-column
            field="createTime"
            :title="$t('payment.transfer.field.createTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column :title="$t('common.operation')" :width="100" fixed="right" :show-overflow="false">
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
          @page-change="handlePageChange"
        />
      </a-card>
    </div>

    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('payment.transfer.detail')"
      :size="640"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.transfer.field.merchant')">
            {{ detail.mchName || detail.mchNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.appId')">
            {{ detail.appId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.tradeNo')">
            {{ detail.tradeNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.containerChannel')">
            {{ detail.containerChannel ? $t(`payment.transfer.channel.${detail.containerChannel}`) : '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.status')">
            <a-tag :color="statusColor(detail.status)">
              {{ detail.status ? $t(`payment.transfer.status.${detail.status}`) : '-' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.currency')">
            {{ detail.currency || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.amount')">
            {{ formatAmount(detail.amount) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.title')">
            {{ detail.title || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.outTransferNo')" :span="2">
            {{ detail.outTransferNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.relationNo')" :span="2">
            {{ detail.relationNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.finishTime')">
            {{ formatDateTime(detail.finishTime) || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.createTime')">
            {{ formatDateTime(detail.createTime) || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>

      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>
  </div>
</template>
