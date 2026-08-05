<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { RefundOrderApi, type RefundOrderQuery, type RefundOrderResult } from '#/api/payment/order/refund-order.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { productI18nMap, productNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import { useOrderLabels } from './composables/useOrderLabels';

  defineOptions({ name: 'RefundOrderList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 订单详情编码字段展示名(支付通道)
  const { channelLabel } = useOrderLabels();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  const queryForm = ref<RefundOrderQuery>({});

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<RefundOrderResult[]>([]);

  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<RefundOrderResult>({});
  const actionLoading = ref(false);

  // 退款状态（无 init）
  const statusOptions = computed(() =>
    ['progress', 'success', 'fail', 'close'].map((v) => ({
      label: $t(`payment.order.refund.status.${v}`),
      value: v,
    })),
  );

  // 交易类型（原支付形态）
  const tradeTypeOptions = computed(() =>
    ['normal', 'gateway'].map((v) => ({
      label: $t(`payment.order.tradeType.${v}`),
      value: v,
    })),
  );

  // 支付产品
  const productOptions = computed(() =>
    Object.keys(productNameMap).map((code) => ({
      label: productLabel(code),
      value: code,
    })),
  );

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'refundNo',
      name: $t('payment.order.field.refundNo'),
      placeholder: $t('payment.order.placeholder.refundNo'),
    },
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
      name: $t('payment.order.field.bizOrderNo'),
      placeholder: $t('payment.order.placeholder.bizOrderNo'),
    },
    {
      type: 'list',
      field: 'status',
      // 退款状态
      name: $t('payment.order.refund.statusLabel'),
      selectList: statusOptions.value,
    },
    {
      type: 'list',
      field: 'tradeType',
      // 交易类型
      name: $t('payment.order.field.tradeType'),
      selectList: tradeTypeOptions.value,
    },
    {
      type: 'list',
      field: 'product',
      // 支付产品
      name: $t('payment.order.field.product'),
      selectList: productOptions.value,
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

  function formatAmount(amount?: number): string {
    if (amount === null || amount === undefined) return '-';
    return (amount / 100).toFixed(2);
  }

  function statusColor(status?: string): string {
    return status ? $t(`payment.order.refund.statusColor.${status}`) : 'default';
  }

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

  function tradeTypeLabel(code?: string): string {
    if (!code) return '-';
    const text = $t(`payment.order.tradeType.${code}`);
    return text && text !== `payment.order.tradeType.${code}` ? text : code;
  }

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

  // 判断是否为超7天未确认的PROGRESS退款单(可手动关闭)
  function isStaleProgress(row: RefundOrderResult): boolean {
    if (row.status !== 'progress') return false;
    if (!row.createTime) return false;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(row.createTime).getTime() < sevenDaysAgo;
  }

  function handleManualClose(row: RefundOrderResult) {
    confirm({
      title: $t('payment.order.action.manualCloseConfirmTitle'),
      content: $t('payment.order.action.manualCloseConfirmContent'),
      okType: 'danger',
      okText: $t('payment.order.action.manualClose'),
      onOk() {
        actionLoading.value = true;
        return RefundOrderApi.manualClose(row.id!)
          .then(() => {
            message.success($t('payment.order.action.manualCloseSuccess'));
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
          <vxe-column field="tradeNo" :title="$t('payment.order.field.tradeNo')" :min-width="200" show-overflow />
          <vxe-column field="bizOrderNo" :title="$t('payment.order.field.bizOrderNo')" :min-width="180" show-overflow />
          <vxe-column field="amount" :title="$t('payment.order.field.amount')" :min-width="100" align="right">
            <template #default="{ row }">
              {{ formatAmount(row.amount) }}
            </template>
          </vxe-column>
          <vxe-column field="status" :title="$t('payment.order.refund.statusLabel')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.status)">
                {{ $t(`payment.order.refund.status.${row.status}`) }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="tradeType" :title="$t('payment.order.field.tradeType')" :min-width="110">
            <template #default="{ row }">{{ tradeTypeLabel(row.tradeType) }}</template>
          </vxe-column>
          <vxe-column field="product" :title="$t('payment.order.field.product')" :min-width="140" show-overflow>
            <template #default="{ row }">{{ productLabel(row.product) }}</template>
          </vxe-column>
          <vxe-column
            field="createTime"
            :title="$t('payment.order.field.createTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column :title="$t('common.operation')" :width="200" fixed="right" :show-overflow="false">
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
                <a-dropdown v-if="isStaleProgress(row) && hasPermission(PermCodes.Trade.Refund.MANAGE)">
                  <a-button type="link" size="small" @click.prevent>
                    {{ $t('common.more') }}
                  </a-button>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item danger @click="handleManualClose(row)">
                        {{ $t('payment.order.action.manualClose') }}
                      </a-menu-item>
                    </a-menu>
                  </template>
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
      :title="$t('payment.order.refund.detail')"
      :size="720"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <!-- 身份信息 -->
        <div class="mb-4 text-sm font-medium">{{ $t('payment.order.refund.section.identity') }}</div>
        <a-descriptions :column="2" size="small" bordered class="mb-4">
          <a-descriptions-item :label="$t('payment.order.field.appId')">
            {{ detail.appId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.refundNo')">
            {{ detail.refundNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bizRefundNo')">
            {{ detail.bizRefundNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.title')" :span="2">
            {{ detail.title || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 关联资金 -->
        <div class="mb-4 text-sm font-medium">{{ $t('payment.order.refund.section.fund') }}</div>
        <a-descriptions :column="2" size="small" bordered class="mb-4">
          <a-descriptions-item :label="$t('payment.order.field.tradeNo')">
            {{ detail.tradeNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.tradeType')">
            {{ tradeTypeLabel(detail.tradeType) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bizOrderNo')">
            {{ detail.bizOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.outOrderNo')">
            {{ detail.outOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.relationOrderNo')">
            {{ detail.relationOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.outRefundNo')">
            {{ detail.outRefundNo || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 金额与状态 -->
        <div class="mb-4 text-sm font-medium">{{ $t('payment.order.refund.section.amount') }}</div>
        <a-descriptions :column="2" size="small" bordered class="mb-4">
          <a-descriptions-item :label="$t('payment.order.refund.statusLabel')">
            <a-tag :color="statusColor(detail.status)">
              {{ detail.status ? $t(`payment.order.refund.status.${detail.status}`) : '-' }}
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
          <a-descriptions-item :label="$t('payment.order.field.reason')" :span="2">
            {{ detail.reason || '-' }}
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

        <!-- 通道快照（产品为主，不展示能力） -->
        <div class="mb-4 text-sm font-medium">{{ $t('payment.order.refund.section.channel') }}</div>
        <a-descriptions :column="2" size="small" bordered class="mb-4">
          <a-descriptions-item :label="$t('payment.order.field.product')">
            {{ productLabel(detail.product) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channel')">
            {{ channelLabel(detail.channel) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channelMchNo')">
            {{ detail.channelMchNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channelAppId')">
            {{ detail.channelAppId || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 通知与审计 -->
        <div class="mb-4 text-sm font-medium">{{ $t('payment.order.refund.section.notify') }}</div>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.order.field.notifyUrl')" :span="2">
            {{ detail.notifyUrl || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.attach')" :span="2">
            {{ detail.attach || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.clientIp')">
            {{ detail.clientIp || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.storeNo')">
            {{ detail.storeNo || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>

      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>
  </div>
</template>
