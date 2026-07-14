<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { RefundOrderApi, type RefundOrderQuery, type RefundOrderResult } from '#/api/payment/order/refund-order.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'RefundOrderList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 查询条件
  const queryForm = ref<RefundOrderQuery>({});

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<RefundOrderResult[]>([]);

  // 详情抽屉
  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<RefundOrderResult>({});
  const actionLoading = ref(false);

  // 退款状态下拉
  const statusOptions = computed(() =>
    ['init', 'progress', 'success', 'fail', 'close'].map((v) => ({
      label: $t(`payment.order.refund.status.${v}`),
      value: v,
    })),
  );

  // 支付通道下拉(常用通道)
  const channelOptions = computed(() =>
    ['alipay', 'wechat', 'douyin'].map((v) => ({
      label: $t(`payment.channel.common.${v}`),
      value: v,
    })),
  );

  // 查询字段
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'refundNo',
      name: $t('payment.order.field.refundNo'),
      placeholder: $t('payment.order.placeholder.refundNo'),
    },
    {
      type: 'string',
      field: 'orderNo',
      name: $t('payment.order.field.orderNo'),
      placeholder: $t('payment.order.placeholder.orderNo'),
    },
    {
      type: 'string',
      field: 'bizOrderNo',
      name: $t('payment.order.field.bizOrderNo'),
      placeholder: $t('payment.order.placeholder.bizOrderNo'),
    },
    {
      type: 'list',
      field: 'status',
      name: $t('payment.order.field.bizStatus'),
      selectList: statusOptions.value,
    },
    {
      type: 'list',
      field: 'channel',
      name: $t('payment.order.field.channel'),
      selectList: channelOptions.value,
    },
    {
      type: 'date_time_range',
      field: 'createTime',
      name: $t('payment.order.field.createTime'),
      startField: 'createTimeStart',
      endField: 'createTimeEnd',
    },
  ]);

  /**
   * 分页查询
   */
  function queryPage() {
    loading.value = true;
    return RefundOrderApi.page({
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

  /**
   * 金额分转元
   */
  function formatAmount(amount?: number): string {
    if (amount === null || amount === undefined) return '-';
    return (amount / 100).toFixed(2);
  }

  /**
   * 退款状态颜色
   */
  function statusColor(status?: string): string {
    return status ? $t(`payment.order.refund.statusColor.${status}`) : 'default';
  }

  function channelLabel(code?: string): string {
    if (!code) return '-';
    return channelOptions.value.find((o) => o.value === code)?.label || code;
  }

  /**
   * 查看详情
   */
  async function handleView(row: RefundOrderResult) {
    drawerVisible.value = true;
    drawerLoading.value = true;
    try {
      const { data } = await RefundOrderApi.getById(row.id!);
      detail.value = data || {};
    } finally {
      drawerLoading.value = false;
    }
  }

  /**
   * 同步退款状态
   */
  function handleSync(row: RefundOrderResult) {
    confirm({
      title: $t('payment.order.action.syncConfirmTitle'),
      content: $t('payment.order.action.syncConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return RefundOrderApi.sync(row.id!)
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
          <vxe-column field="refundNo" :title="$t('payment.order.field.refundNo')" :min-width="200" show-overflow />
          <vxe-column field="orderNo" :title="$t('payment.order.field.orderNo')" :min-width="200" show-overflow />
          <vxe-column field="bizOrderNo" :title="$t('payment.order.field.bizOrderNo')" :min-width="180" show-overflow />
          <vxe-column field="amount" :title="$t('payment.order.field.amount')" :min-width="100" align="right">
            <template #default="{ row }">
              {{ formatAmount(row.amount) }}
            </template>
          </vxe-column>
          <vxe-column field="status" :title="$t('payment.order.field.bizStatus')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.status)">
                {{ $t(`payment.order.refund.status.${row.status}`) }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="channel" :title="$t('payment.order.field.channel')" :min-width="100">
            <template #default="{ row }">{{ channelLabel(row.channel) }}</template>
          </vxe-column>
          <vxe-column
            field="finishTime"
            :title="$t('payment.order.field.finishTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column
            field="createTime"
            :title="$t('payment.order.field.createTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column :title="$t('common.operation')" width="160" fixed="right" :show-overflow="false">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleView(row)">
                  {{ $t('common.view') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.Trade.Refund.MANAGE)"
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

    <!-- 详情抽屉 -->
    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('payment.order.refund.detail')"
      :size="700"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.order.field.refundNo')">
            {{ detail.refundNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bizRefundNo')">
            {{ detail.bizRefundNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.orderNo')">
            {{ detail.orderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bizOrderNo')">
            {{ detail.bizOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.outRefundNo')">
            {{ detail.outRefundNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bizStatus')">
            <a-tag :color="statusColor(detail.status)">
              {{ detail.status ? $t(`payment.order.refund.status.${detail.status}`) : '-' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.amount')">
            {{ formatAmount(detail.amount) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.orderAmount')">
            {{ formatAmount(detail.orderAmount) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channel')">
            {{ channelLabel(detail.channel) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.method')">
            {{ detail.method || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.reason')" :span="2">
            {{ detail.reason || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.finishTime')">
            {{ detail.finishTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.createTime')">
            {{ detail.createTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.errorMsg')" :span="2">
            {{ detail.errorMsg || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>

      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>
  </div>
</template>
