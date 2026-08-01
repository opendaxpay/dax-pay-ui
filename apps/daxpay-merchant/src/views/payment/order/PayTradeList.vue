<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PayTradeApi, type PayTradeQuery, type PayTradeResult } from '#/api/payment/order/pay-trade.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import { useTradeActions } from './composables/useTradeActions';

  defineOptions({ name: 'PayTradeList' });

  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 查询条件
  const queryForm = ref<PayTradeQuery>({});

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<PayTradeResult[]>([]);

  // 详情抽屉
  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<PayTradeResult>({});

  // 资金状态下拉（含 cancel）
  const statusOptions = computed(() =>
    ['init', 'processing', 'success', 'fail', 'close', 'cancel'].map((v) => ({
      label: $t(`payment.order.fundStatus.${v}`),
      value: v,
    })),
  );

  // 交易形态下拉（与 PayTradeTypeEnum 已落地形态对齐）
  const tradeTypeOptions = computed(() =>
    ['normal', 'gateway'].map((v) => ({
      label: $t(`payment.order.tradeType.${v}`),
      value: v,
    })),
  );

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'tradeNo',
      name: $t('payment.order.field.tradeNo'),
      placeholder: $t('payment.order.placeholder.tradeNo'),
    },
    {
      type: 'string',
      field: 'outOrderNo',
      name: $t('payment.order.field.outOrderNo'),
      placeholder: $t('payment.order.placeholder.outOrderNo'),
    },
    {
      type: 'list',
      field: 'status',
      name: $t('payment.order.field.fundStatus'),
      selectList: statusOptions.value,
    },
    {
      type: 'list',
      field: 'tradeType',
      name: $t('payment.order.field.tradeType'),
      selectList: tradeTypeOptions.value,
    },
    {
      type: 'string',
      field: 'channelMchNo',
      name: $t('payment.order.field.channelMchNo'),
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
    return PayTradeApi.page({
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
   * 资金状态颜色
   */
  function statusColor(status?: string): string {
    return status ? $t(`payment.order.fundStatusColor.${status}`) : 'default';
  }

  /**
   * 查看详情
   */
  async function handleView(row: PayTradeResult) {
    drawerVisible.value = true;
    drawerLoading.value = true;
    try {
      const { data } = await PayTradeApi.getById(row.id!);
      detail.value = data || {};
    } finally {
      drawerLoading.value = false;
    }
  }

  // 交易操作(同步/关闭)
  const { handleSync, handleClose } = useTradeActions({
    syncFn: (id) => PayTradeApi.sync(id),
    closeFn: (id) => PayTradeApi.close(id),
    onSuccess: queryPage,
  });

  /**
   * 更多操作菜单(同步/关闭, 按资金状态与权限动态生成)
   */
  function getActionMenu(row: PayTradeResult): MenuProps {
    const items: { danger?: boolean; key: string; label: string }[] = [];
    const canManage = hasPermission(PermCodes.Trade.Fund.MANAGE);
    const isTerminal = ['fail', 'close', 'cancel'].includes(row.status ?? '');
    // 关闭(待支付: init/processing)
    if (canManage && ['init', 'processing'].includes(row.status ?? '')) {
      items.push({ key: 'close', label: $t('payment.order.action.close'), danger: true });
    }
    // 同步(非终态)
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
          case 'sync': {
            handleSync(row.id!);
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
          <vxe-column field="tradeNo" :title="$t('payment.order.field.tradeNo')" :min-width="200" show-overflow />
          <vxe-column field="tradeType" :title="$t('payment.order.field.tradeType')" :min-width="100">
            <template #default="{ row }">
              {{ row.tradeType ? $t(`payment.order.tradeType.${row.tradeType}`) : '-' }}
            </template>
          </vxe-column>
          <vxe-column field="outOrderNo" :title="$t('payment.order.field.outOrderNo')" :min-width="180" show-overflow />
          <vxe-column field="amount" :title="$t('payment.order.field.amount')" :min-width="100" align="right">
            <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
          </vxe-column>
          <vxe-column
            field="postedAmount"
            :title="$t('payment.order.field.postedAmount')"
            :min-width="100"
            align="right"
          >
            <template #default="{ row }">{{ formatAmount(row.postedAmount) }}</template>
          </vxe-column>
          <vxe-column
            field="refundableBalance"
            :title="$t('payment.order.field.refundableBalance')"
            :min-width="100"
            align="right"
          >
            <template #default="{ row }">{{ formatAmount(row.refundableBalance) }}</template>
          </vxe-column>
          <vxe-column field="status" :title="$t('payment.order.field.fundStatus')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.status)">
                {{ $t(`payment.order.fundStatus.${row.status}`) }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column
            field="channelMchNo"
            :title="$t('payment.order.field.channelMchNo')"
            :min-width="140"
            show-overflow
          />
          <vxe-column
            field="payTime"
            :title="$t('payment.order.field.payTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
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
                <!-- 更多操作(同步/关闭, 按资金状态与权限动态生成) -->
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

    <!-- 详情抽屉 -->
    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('payment.order.trade.detail')"
      :size="900"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-divider orientation="left" plain>{{ $t('payment.order.trade.detail') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.order.field.tradeNo')">
            {{ detail.tradeNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.tradeType')">
            {{ detail.tradeType ? $t(`payment.order.tradeType.${detail.tradeType}`) : '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.outOrderNo')">
            {{ detail.outOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.orderNo')">
            {{ detail.containerOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bizOrderNo')">
            {{ detail.bizOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.title')">
            {{ detail.title || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.fundStatus')">
            <a-tag :color="statusColor(detail.status)">
              {{ detail.status ? $t(`payment.order.fundStatus.${detail.status}`) : '-' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.containerStatus')">
            {{ detail.containerStatus ? $t(`payment.order.bizStatus.${detail.containerStatus}`) : '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.amount')">
            {{ formatAmount(detail.amount) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.postedAmount')">
            {{ formatAmount(detail.postedAmount) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.refundableBalance')">
            {{ formatAmount(detail.refundableBalance) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channel')">
            {{ detail.channel || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.method')">
            {{ detail.method || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channelAppId')">
            {{ detail.channelAppId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.product')">
            {{ detail.product || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.provider')">
            {{ detail.provider || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.channelMchNo')">
            {{ detail.channelMchNo || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left" plain>{{ $t('payment.order.field.transOrderNo') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.order.field.transOrderNo')">
            {{ detail.transOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.relationOrderNo')">
            {{ detail.relationOrderNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.buyerId')">
            {{ detail.buyerId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.openid')">
            {{ detail.openid || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.tradeProduct')">
            {{ detail.tradeProduct || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.tradeWay')">
            {{ detail.tradeWay || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.bankType')">
            {{ detail.bankType || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.source')">
            {{ detail.source || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.order.field.storeNo')">
            {{ detail.storeNo || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left" plain>{{ $t('payment.order.field.createTime') }}</a-divider>
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
