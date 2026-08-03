<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { OrderCloseApi } from '#/api/payment/order/close.api';
  import {
    GatewayOrderApi,
    type GatewayOrderQuery,
    type GatewayOrderResult,
  } from '#/api/payment/order/gateway-order.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { productI18nMap, productNameMap } from '#/enums/payment';
  import { usePermission } from '#/hooks/usePermission';

  import { useTradeActions } from './composables/useTradeActions';

  defineOptions({ name: 'GatewayOrderList' });

  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  const queryForm = ref<GatewayOrderQuery>({});

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<GatewayOrderResult[]>([]);

  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<GatewayOrderResult>({});

  // 网关业务状态
  const statusOptions = computed(() =>
    ['wait_pay', 'paying', 'paid', 'failed', 'closed', 'expired'].map((v) => ({
      label: $t(`payment.order.bizStatus.${v}`),
      value: v,
    })),
  );

  const gatewayTypeOptions = computed(() =>
    ['cashier', 'aggregate'].map((v) => ({
      label: $t(`payment.order.gatewayType.${v}`),
      value: v,
    })),
  );

  // 支付产品下拉
  const productOptions = computed(() =>
    Object.keys(productNameMap).map((code) => ({
      label: productLabel(code),
      value: code,
    })),
  );

  const queryFields = computed<QueryField[]>(() => [
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
      field: 'gatewayType',
      // 网关类型
      name: $t('payment.order.field.gatewayType'),
      selectList: gatewayTypeOptions.value,
    },
    {
      type: 'list',
      field: 'product',
      // 支付产品
      name: $t('payment.order.field.product'),
      selectList: productOptions.value,
    },
    {
      type: 'string',
      field: 'capability',
      // 支付能力
      name: $t('payment.order.field.capability'),
    },
    {
      type: 'date_time_range',
      field: 'createTime',
      name: $t('payment.order.field.createTime'),
      startField: 'createTimeStart',
      endField: 'createTimeEnd',
    },
  ]);

  function queryPage() {
    loading.value = true;
    return GatewayOrderApi.page({
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
    return status ? $t(`payment.order.bizStatusColor.${status}`) : 'default';
  }

  /**
   * 支付产品展示名
   */
  function productLabel(code?: string): string {
    if (!code) return '-';
    const i18nKey = productI18nMap[code];
    if (i18nKey) {
      const text = $t(i18nKey);
      if (text && text !== i18nKey) {
        return text;
      }
    }
    return productNameMap[code] || code;
  }

  /**
   * 支付能力展示名
   */
  function capabilityLabel(code?: string): string {
    if (!code) return '-';
    const i18nKey = `payment.merchant.cashier.cashier.capabilities.${code}`;
    const text = $t(i18nKey);
    return text && text !== i18nKey ? text : code;
  }

  async function handleView(row: GatewayOrderResult) {
    drawerVisible.value = true;
    drawerLoading.value = true;
    try {
      const { data } = await GatewayOrderApi.getById(row.id!);
      detail.value = data || {};
    } finally {
      drawerLoading.value = false;
    }
  }

  // 交易操作(关闭)
  const { handleClose } = useTradeActions({
    closeFn: (row) => OrderCloseApi.close(row.id!, 'gateway'),
    onSuccess: queryPage,
  });

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
          <vxe-column field="orderNo" :title="$t('payment.order.field.orderNo')" :min-width="200" show-overflow />
          <vxe-column field="bizOrderNo" :title="$t('payment.order.field.bizOrderNo')" :min-width="180" show-overflow />
          <vxe-column field="gatewayType" :title="$t('payment.order.field.gatewayType')" :min-width="100">
            <template #default="{ row }">
              {{ row.gatewayType ? $t(`payment.order.gatewayType.${row.gatewayType}`) : '-' }}
            </template>
          </vxe-column>
          <vxe-column field="title" :title="$t('payment.order.field.title')" :min-width="140" show-overflow />
          <vxe-column field="amount" :title="$t('payment.order.field.amount')" :min-width="100" align="right">
            <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
          </vxe-column>
          <vxe-column field="status" :title="$t('payment.order.field.bizStatus')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.status)">
                {{ $t(`payment.order.bizStatus.${row.status}`) }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="product" :title="$t('payment.order.field.product')" :min-width="140" show-overflow>
            <template #default="{ row }">{{ productLabel(row.product) }}</template>
          </vxe-column>
          <vxe-column field="capability" :title="$t('payment.order.field.capability')" :min-width="140" show-overflow>
            <template #default="{ row }">{{ capabilityLabel(row.capability) }}</template>
          </vxe-column>
          <vxe-column field="mchName" :title="$t('payment.order.field.merchant')" :min-width="160">
            <template #default="{ row }">
              <div class="flex flex-col">
                <span>{{ row.mchName || '-' }}</span>
                <span v-if="row.mchNo" class="text-xs text-muted-foreground">{{ row.mchNo }}</span>
              </div>
            </template>
          </vxe-column>
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
                <!-- 关闭(待支付/支付中 + 管理权限) -->
                <a-button
                  v-if="
                    hasPermission(PermCodes.Trade.Order.MANAGE) &&
                    (row.status === 'wait_pay' || row.status === 'paying')
                  "
                  type="link"
                  size="small"
                  danger
                  @click="handleClose(row)"
                >
                  {{ $t('payment.order.action.close') }}
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
      :title="$t('payment.order.gateway.detail')"
      :size="900"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.order.field.merchant')">
            {{ detail.mchName || '-' }}
            <span v-if="detail.mchNo" class="text-muted-foreground"> ({{ detail.mchNo }})</span>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.orderNo')">
            {{ detail.orderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bizOrderNo')">
            {{ detail.bizOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.tradeNo')">
            {{ detail.tradeNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.title')">
            {{ detail.title || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bizStatus')">
            <a-tag :color="statusColor(detail.status)">
              {{ detail.status ? $t(`payment.order.bizStatus.${detail.status}`) : '-' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.amount')">
            {{ formatAmount(detail.amount) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.fundStatus')">
            {{ detail.fundStatus ? $t(`payment.order.fundStatus.${detail.fundStatus}`) : '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.product')">
            {{ productLabel(detail.product) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.capability')">
            {{ capabilityLabel(detail.capability) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channel')">
            {{ detail.channel || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.method')">
            {{ detail.method || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.outOrderNo')">
            {{ detail.outOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.refundableBalance')">
            {{ formatAmount(detail.refundableBalance) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.payTime')">
            {{ formatDateTime(detail.payTime) || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.clientIp')">
            {{ detail.clientIp || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.storeNo')">
            {{ detail.storeNo || '-' }}
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
