<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { NormalOrderApi, type NormalOrderQuery, type NormalOrderResult } from '#/api/payment/order/normal-order.api';
  import { OrderCloseApi } from '#/api/payment/order/close.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { productI18nMap, productNameMap } from '#/enums/payment';
  import { usePermission } from '#/hooks/usePermission';
  import { useTradeActions } from './composables/useTradeActions';
  import RefundModal from './components/RefundModal.vue';

  defineOptions({ name: 'NormalOrderList' });

  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 查询条件
  const queryForm = ref<NormalOrderQuery>({});

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<NormalOrderResult[]>([]);

  // 详情抽屉
  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<NormalOrderResult>({});
  // 退款弹窗
  const refundModalRef = ref();

  // 业务状态下拉（含 failed）
  const statusOptions = computed(() =>
    ['wait_pay', 'paid', 'failed', 'closed', 'expired'].map((v) => ({
      label: $t(`payment.order.bizStatus.${v}`),
      value: v,
    })),
  );

  // 支付产品下拉（主数据产品码）
  const productOptions = computed(() =>
    Object.keys(productNameMap).map((code) => ({
      label: productLabel(code),
      value: code,
    })),
  );

  // 查询字段
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'bizOrderNo',
      name: $t('payment.order.field.bizOrderNo'),
      placeholder: $t('payment.order.placeholder.bizOrderNo'),
    },
    {
      type: 'string',
      field: 'title',
      name: $t('payment.order.field.title'),
      placeholder: $t('payment.order.placeholder.title'),
    },
    {
      type: 'list',
      field: 'status',
      name: $t('payment.order.field.bizStatus'),
      selectList: statusOptions.value,
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
    {
      type: 'number',
      field: 'amountMin',
      name: $t('payment.order.placeholder.amountMin'),
    },
    {
      type: 'number',
      field: 'amountMax',
      name: $t('payment.order.placeholder.amountMax'),
    },
  ]);

  /**
   * 分页查询
   */
  function queryPage() {
    loading.value = true;
    return NormalOrderApi.page({
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
   * 业务状态颜色
   */
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
   * 支付能力展示名（复用收银台能力字典）
   */
  function capabilityLabel(code?: string): string {
    if (!code) return '-';
    const i18nKey = `payment.merchant.cashier.cashier.capabilities.${code}`;
    const text = $t(i18nKey);
    return text && text !== i18nKey ? text : code;
  }

  /**
   * 查看详情
   */
  async function handleView(row: NormalOrderResult) {
    drawerVisible.value = true;
    drawerLoading.value = true;
    try {
      const { data } = await NormalOrderApi.getById(row.id!);
      detail.value = data || {};
    } finally {
      drawerLoading.value = false;
    }
  }

  // 交易操作(同步/关闭)
  const { handleSync, handleClose } = useTradeActions({
    syncFn: (id) => NormalOrderApi.sync(id),
    closeFn: (id) => OrderCloseApi.close(id, 'normal'),
    onSuccess: queryPage,
  });

  function handleDrawerClose() {
    drawerVisible.value = false;
    detail.value = {};
  }

  /**
   * 更多操作菜单(退款/关闭/同步, 按状态与权限动态生成)
   */
  function getActionMenu(row: NormalOrderResult): MenuProps {
    const items: { danger?: boolean; key: string; label: string }[] = [];
    const canManage = hasPermission(PermCodes.Trade.Order.MANAGE);
    const canRefund = hasPermission(PermCodes.Trade.Refund.MANAGE);
    const isTerminal = row.status === 'closed' || row.status === 'expired';
    // 退款(已支付 + 退款权限)
    if (canRefund && row.status === 'paid') {
      items.push({ key: 'refund', label: $t('payment.order.action.refund'), danger: true });
    }
    // 关闭(待支付 + 管理权限)
    if (canManage && row.status === 'wait_pay') {
      items.push({ key: 'close', label: $t('payment.order.action.close'), danger: true });
    }
    // 同步(非终态 + 管理权限)
    if (canManage && !isTerminal) {
      items.push({ key: 'sync', label: $t('payment.order.action.sync') });
    }
    return {
      items,
      onClick: ({ key }: { key: string }) => {
        switch (key) {
          case 'close': {
            handleClose(row.id!);
            break;
          }
          case 'refund': {
            refundModalRef.value?.open(row);
            break;
          }
          case 'sync': {
            handleSync(row.id!);
            break;
          }
        }
      },
    };
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
          <!-- 商户: 名称上 + 号下小字两排 -->
          <vxe-column field="mchName" :title="$t('payment.order.field.merchant')" :min-width="160">
            <template #default="{ row }">
              <div class="flex flex-col">
                <span>{{ row.mchName || '-' }}</span>
                <span v-if="row.mchNo" class="text-xs text-muted-foreground">{{ row.mchNo }}</span>
              </div>
            </template>
          </vxe-column>
          <vxe-column field="orderNo" :title="$t('payment.order.field.orderNo')" :min-width="200" show-overflow />
          <vxe-column field="bizOrderNo" :title="$t('payment.order.field.bizOrderNo')" :min-width="180" show-overflow />
          <vxe-column field="title" :title="$t('payment.order.field.title')" :min-width="160" show-overflow />
          <vxe-column field="amount" :title="$t('payment.order.field.amount')" :min-width="100" align="right">
            <template #default="{ row }">
              {{ formatAmount(row.amount) }}
            </template>
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
          <vxe-column :title="$t('common.operation')" width="140" fixed="right" :show-overflow="false">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleView(row)">
                  {{ $t('common.view') }}
                </a-button>
                <!-- 更多操作(退款/关闭/同步, 按状态与权限动态生成) -->
                <a-dropdown v-if="getActionMenu(row).items?.length" :menu="getActionMenu(row)">
                  <a href="javascript:">
                    {{ $t('common.more') }}
                    <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                  </a>
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

    <!-- 详情抽屉 -->
    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('payment.order.normal.detail')"
      :size="900"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-divider orientation="left" plain>{{ $t('payment.order.normal.detail') }}</a-divider>
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
          <a-descriptions-item :label="$t('payment.order.field.currency')">
            {{ detail.currency || '-' }}
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
          <a-descriptions-item :label="$t('payment.order.field.channelMchNo')">
            {{ detail.channelMchNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channelAppId')">
            {{ detail.channelAppId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.outOrderNo')">
            {{ detail.outOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.fundStatus')">
            {{ detail.fundStatus ? $t(`payment.order.fundStatus.${detail.fundStatus}`) : '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.storeNo')">
            {{ detail.storeNo || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left" plain>{{ $t('payment.order.field.payTime') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.order.field.createTime')">
            {{ detail.createTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.expiredTime')">
            {{ detail.expiredTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.payTime')">
            {{ detail.payTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.closeTime')">
            {{ detail.closeTime || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left" plain>{{ $t('payment.order.field.buyerId') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.order.field.buyerId')">
            {{ detail.buyerId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.openid')">
            {{ detail.openid || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.refundableBalance')">
            {{ formatAmount(detail.refundableBalance) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bankType')">
            {{ detail.bankType || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.notifyUrl')" :span="2">
            {{ detail.notifyUrl || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.returnUrl')" :span="2">
            {{ detail.returnUrl || '-' }}
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
    <RefundModal
      ref="refundModalRef"
      :fetch-detail="(id) => NormalOrderApi.getById(id).then((res) => res.data)"
      @success="queryPage"
    />
  </div>
</template>
