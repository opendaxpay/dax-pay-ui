<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    GatewayOrderApi,
    type GatewayOrderQuery,
    type GatewayOrderResult,
  } from '#/api/payment/order/gateway-order.api';
  import { type RefundParam, RefundOrderApi } from '#/api/payment/order/refund-order.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { productI18nMap, productNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'GatewayOrderList' });

  const { confirm, message } = useMessage();
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
  const actionLoading = ref(false);

  // 退款弹窗
  const refundVisible = ref(false);
  const refundLoading = ref(false);
  const refundFetching = ref(false);
  const refundFormRef = ref();
  const refundForm = ref<{ amount?: number; tradeNo?: string; reason?: string }>({ amount: undefined, reason: '' });
  const refundRow = ref<GatewayOrderResult | null>(null);
  const refundableYuan = computed(() => (refundRow.value?.refundableBalance ?? 0) / 100);
  const refundRules = computed(() => ({
    amount: [
      { required: true, message: $t('payment.order.action.refundAmountPlaceholder') },
      {
        type: 'number',
        min: 0.01,
        message: $t('payment.order.action.refundAmountPlaceholder'),
      },
      {
        validator: async (_rule: unknown, value: number) => {
          if (value != null && value > refundableYuan.value) {
            return Promise.reject(new Error($t('payment.order.action.refundAmountExceed')));
          }
        },
      },
    ],
  }));

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

  function handleSync(row: GatewayOrderResult) {
    confirm({
      title: $t('payment.order.action.syncConfirmTitle'),
      content: $t('payment.order.action.syncConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return GatewayOrderApi.sync(row.id!)
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

  function handleClose(row: GatewayOrderResult) {
    confirm({
      title: $t('payment.order.action.closeConfirmTitle'),
      content: $t('payment.order.action.closeConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return GatewayOrderApi.close(row.id!)
          .then(() => {
            message.success($t('payment.order.action.closeSuccess'));
            queryPage();
          })
          .finally(() => {
            actionLoading.value = false;
          });
      },
    });
  }

  async function openRefund(row: GatewayOrderResult) {
    refundRow.value = row;
    refundVisible.value = true;
    refundFetching.value = true;
    try {
      const { data } = await GatewayOrderApi.getById(row.id!);
      refundRow.value = data || row;
      refundForm.value = {
        tradeNo: data?.tradeNo,
        reason: '',
        amount: (data?.refundableBalance ?? 0) / 100,
      };
    } finally {
      refundFetching.value = false;
    }
  }

  async function submitRefund() {
    if (!refundRow.value) {
      return;
    }
    try {
      await refundFormRef.value?.validate();
    } catch {
      return;
    }
    const amountYuan = refundForm.value.amount ?? 0;
    const param: RefundParam = {
      tradeNo: refundForm.value.tradeNo,
      bizOrderNo: refundRow.value.bizOrderNo,
      amount: Math.round(amountYuan * 100),
      reason: refundForm.value.reason,
    };
    confirm({
      title: $t('payment.order.action.refundConfirmTitle'),
      content: $t('payment.order.action.refundConfirmContent', { amount: amountYuan.toFixed(2) }),
      onOk() {
        refundLoading.value = true;
        return RefundOrderApi.refund(param)
          .then(() => {
            message.success($t('payment.order.action.refundSuccess'));
            refundVisible.value = false;
            queryPage();
          })
          .finally(() => {
            refundLoading.value = false;
          });
      },
    });
  }

  function getActionMenu(row: GatewayOrderResult): MenuProps {
    const items: MenuProps['items'] = [];
    if (hasPermission(PermCodes.Trade.GatewayOrder.MANAGE)) {
      if (row.status === 'wait_pay' || row.status === 'paying') {
        items.push({ key: 'sync', label: $t('payment.order.action.sync') });
        items.push({ key: 'close', label: $t('payment.order.action.close'), danger: true });
      }
      if (row.status === 'paid') {
        items.push({ key: 'sync', label: $t('payment.order.action.sync') });
        if (hasPermission(PermCodes.Trade.Refund.MANAGE)) {
          items.push({ key: 'refund', label: $t('payment.order.action.refund'), danger: true });
        }
      }
    }
    return {
      items,
      onClick: ({ key }) => {
        switch (key) {
          case 'sync': {
            handleSync(row);
            break;
          }
          case 'close': {
            handleClose(row);
            break;
          }
          case 'refund': {
            openRefund(row);
            break;
          }
        }
      },
    };
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
                <a-dropdown v-if="getActionMenu(row).items?.length" :menu="getActionMenu(row)">
                  <a-button type="link" size="small">
                    {{ $t('common.more') }}
                    <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                  </a-button>
                </a-dropdown>
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
            {{ detail.payTime || '-' }}
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

    <!-- 退款弹窗 -->
    <a-modal
      v-model:open="refundVisible"
      :title="$t('payment.order.action.refund')"
      :confirm-loading="refundLoading"
      :ok-button-props="{ disabled: refundFetching || !refundForm.tradeNo }"
      @ok="submitRefund"
      @cancel="refundVisible = false"
    >
      <a-spin :spinning="refundFetching">
        <a-form ref="refundFormRef" layout="vertical" :model="refundForm" :rules="refundRules">
          <a-form-item :label="$t('payment.order.field.tradeNo')">
            <a-input :value="refundForm.tradeNo" disabled />
          </a-form-item>
          <a-form-item :label="$t('payment.order.action.refundableBalanceLabel')">
            {{ refundableYuan.toFixed(2) }}
          </a-form-item>
          <a-form-item :label="$t('payment.order.action.refundAmountLabel')" name="amount">
            <a-input-number v-model:value="refundForm.amount" class="w-full" :min="0.01" :precision="2" />
          </a-form-item>
          <a-form-item :label="$t('payment.order.action.refundReasonLabel')" name="reason">
            <a-textarea v-model:value="refundForm.reason" :placeholder="$t('payment.order.action.refundReasonPlaceholder')" />
          </a-form-item>
        </a-form>
      </a-spin>
    </a-modal>
  </div>
</template>
