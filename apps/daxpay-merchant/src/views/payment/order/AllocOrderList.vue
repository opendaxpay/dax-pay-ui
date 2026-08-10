<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { AllocOrderApi, type AllocOrderQuery, type AllocOrderResult } from '#/api/payment/order/alloc-order.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'AllocOrderList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  const queryForm = ref<AllocOrderQuery>({});

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<AllocOrderResult[]>([]);

  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<AllocOrderResult>({});
  const actionLoading = ref(false);

  // 分账状态
  const statusOptions = computed(() =>
    ['processing', 'success', 'partial', 'fail'].map((v) => ({
      label: $t(`payment.order.alloc.status.${v}`),
      value: v,
    })),
  );

  // 分账明细结果
  const detailResultLabel = (result?: string): string => {
    if (!result) return '-';
    return $t(`payment.order.alloc.detailResult.${result}`);
  };

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'allocNo',
      // 平台分账单号
      name: $t('payment.order.field.allocNo'),
      placeholder: $t('payment.order.placeholder.allocNo'),
    },
    {
      type: 'string',
      field: 'bizAllocNo',
      // 商户分账单号
      name: $t('payment.order.field.bizAllocNo'),
      placeholder: $t('payment.order.placeholder.bizAllocNo'),
    },
    {
      type: 'string',
      field: 'tradeNo',
      // 原支付资金交易号
      name: $t('payment.order.field.tradeNo'),
      placeholder: $t('payment.order.placeholder.tradeNo'),
    },
    {
      type: 'list',
      field: 'status',
      // 分账状态
      name: $t('payment.order.alloc.statusLabel'),
      selectList: statusOptions.value,
    },
    {
      type: 'date_time_range',
      field: 'createTime',
      // 创建时间
      name: $t('payment.order.field.createTime'),
      startField: 'createTimeStart',
      endField: 'createTimeEnd',
    },
  ]);

  function queryPage() {
    loading.value = true;
    return AllocOrderApi.page({
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

  // 金额分转元展示
  function formatAmount(amount?: number): string {
    if (amount === null || amount === undefined) return '-';
    return (amount / 100).toFixed(2);
  }

  function statusColor(status?: string): string {
    return status ? $t(`payment.order.alloc.statusColor.${status}`) : 'default';
  }

  // 详情抽屉：getById 后回填
  async function handleView(row: AllocOrderResult) {
    drawerVisible.value = true;
    drawerLoading.value = true;
    try {
      const { data } = await AllocOrderApi.getById(row.id!);
      detail.value = data || {};
    } finally {
      drawerLoading.value = false;
    }
  }

  // 同步分账状态
  function handleSync(row: AllocOrderResult) {
    confirm({
      title: $t('payment.order.action.syncConfirmTitle'),
      content: $t('payment.order.action.syncConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return AllocOrderApi.sync(row.allocNo!)
          .then(() => {
            message.success($t('payment.order.action.syncSuccess'));
            queryPage();
          })
          .finally(() => {
            actionLoading.value = false;
          });
      },
    });
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
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column field="allocNo" :title="$t('payment.order.field.allocNo')" :min-width="200" show-overflow />
          <vxe-column field="bizAllocNo" :title="$t('payment.order.field.bizAllocNo')" :min-width="180" show-overflow />
          <vxe-column field="tradeNo" :title="$t('payment.order.field.tradeNo')" :min-width="200" show-overflow />
          <vxe-column field="amount" :title="$t('payment.order.field.amount')" :min-width="100" align="right">
            <template #default="{ row }">
              {{ formatAmount(row.amount) }}
            </template>
          </vxe-column>
          <vxe-column field="status" :title="$t('payment.order.alloc.statusLabel')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.status)">
                {{ $t(`payment.order.alloc.status.${row.status}`) }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column
            field="createTime"
            :title="$t('payment.order.field.createTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column :title="$t('common.operation')" :width="160" fixed="right" :show-overflow="false">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleView(row)">
                  {{ $t('common.view') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.Trade.Alloc.MANAGE)"
                  type="link"
                  size="small"
                  :loading="actionLoading"
                  @click="handleSync(row)"
                >
                  {{ $t('payment.order.action.sync') }}
                </a-button>
              </a-space>
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
      :title="$t('payment.order.alloc.detail')"
      :size="720"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <!-- 身份信息 -->
        <div class="mb-4 text-sm font-medium">{{ $t('payment.order.alloc.section.identity') }}</div>
        <a-descriptions :column="2" size="small" bordered class="mb-4">
          <a-descriptions-item :label="$t('payment.order.field.appId')">
            {{ detail.appId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.allocNo')">
            {{ detail.allocNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bizAllocNo')">
            {{ detail.bizAllocNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.title')">
            {{ detail.title || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.description')" :span="2">
            {{ detail.description || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 关联资金 -->
        <div class="mb-4 text-sm font-medium">{{ $t('payment.order.alloc.section.fund') }}</div>
        <a-descriptions :column="2" size="small" bordered class="mb-4">
          <a-descriptions-item :label="$t('payment.order.field.tradeNo')">
            {{ detail.tradeNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bizOrderNo')">
            {{ detail.bizOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.outOrderNo')">
            {{ detail.outOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.outAllocNo')">
            {{ detail.outAllocNo || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 金额与状态 -->
        <div class="mb-4 text-sm font-medium">{{ $t('payment.order.alloc.section.amount') }}</div>
        <a-descriptions :column="2" size="small" bordered class="mb-4">
          <a-descriptions-item :label="$t('payment.order.alloc.statusLabel')">
            <a-tag :color="statusColor(detail.status)">
              {{ detail.status ? $t(`payment.order.alloc.status.${detail.status}`) : '-' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.currency')">
            {{ detail.currency || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.amount')">
            {{ formatAmount(detail.amount) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.orderAmount')">
            {{ formatAmount(detail.orderAmount) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.finishTime')">
            {{ formatDateTime(detail.finishTime) || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.createTime')">
            {{ formatDateTime(detail.createTime) || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.errorMsg')" :span="2">
            {{ detail.errorMsg || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 通道快照 -->
        <div class="mb-4 text-sm font-medium">{{ $t('payment.order.alloc.section.channel') }}</div>
        <a-descriptions :column="2" size="small" bordered class="mb-4">
          <a-descriptions-item :label="$t('payment.order.field.channel')">
            {{ detail.channel || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.product')">
            {{ detail.product || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channelMchNo')">
            {{ detail.channelMchNo || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 分账明细 -->
        <div class="mb-4 text-sm font-medium">{{ $t('payment.order.alloc.section.detail') }}</div>
        <vxe-table :data="detail.details || []" size="small" :row-config="{ keyField: 'receiverAccount' }">
          <vxe-column type="seq" :title="$t('common.seq')" width="50" align="center" />
          <vxe-column field="receiverType" :title="$t('payment.order.field.receiverType')" :min-width="120" />
          <vxe-column field="receiverAccount" :title="$t('payment.order.field.receiverAccount')" :min-width="160" />
          <vxe-column field="amount" :title="$t('payment.order.field.amount')" :min-width="90" align="right">
            <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
          </vxe-column>
          <vxe-column field="result" :title="$t('payment.order.alloc.detailResultLabel')" :min-width="90" align="center">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.result)">{{ detailResultLabel(row.result) }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="finishTime" :title="$t('payment.order.field.finishTime')" :min-width="160" formatter="formatDateTime" />
        </vxe-table>
      </a-spin>

      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>
  </div>
</template>
