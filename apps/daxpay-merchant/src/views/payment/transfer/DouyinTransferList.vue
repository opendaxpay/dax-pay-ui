<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';
  import { IconifyIcon } from '@vben-core/icons';

  import {
    type DouyinTransferOrderQuery,
    type DouyinTransferOrderResult,
    TransferApi,
  } from '#/api/payment/transfer/transfer.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import { useRouter } from 'vue-router';

  defineOptions({ name: 'DouyinTransferList' });

  const router = useRouter();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  const queryForm = ref<DouyinTransferOrderQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<DouyinTransferOrderResult[]>([]);

  // 详情抽屉
  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<DouyinTransferOrderResult>({});

  // 转账状态
  const statusOptions = computed(() =>
    ['processing', 'success', 'fail', 'close'].map((v) => ({
      label: $t(`payment.transfer.status.${v}`),
      value: v,
    })),
  );

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'transferNo',
      name: $t('payment.transfer.field.transferNo'),
    },
    {
      type: 'string',
      field: 'bizTransferNo',
      name: $t('payment.transfer.field.bizTransferNo'),
    },
    {
      type: 'string',
      field: 'payeeAccount',
      name: $t('payment.transfer.field.payeeAccount'),
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
    return TransferApi.douyinPage({
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

  async function handleView(row: DouyinTransferOrderResult) {
    drawerVisible.value = true;
    drawerLoading.value = true;
    try {
      const { data } = await TransferApi.douyinGetById(row.id!);
      detail.value = data || {};
    } finally {
      drawerLoading.value = false;
    }
  }

  /** 发起转账: 跳转聚合发起页 */
  function openCreate() {
    router.push({ path: '/trade/transfer/create', query: { channel: 'douyin' } });
  }

  function handleSync(row: DouyinTransferOrderResult) {
    confirm({
      title: $t('payment.transfer.syncConfirmTitle'),
      content: $t('payment.transfer.syncConfirmContent'),
      onOk() {
        return TransferApi.sync('douyin', row.id!).then(() => {
          message.success($t('payment.transfer.syncSuccess'));
          queryPage();
        });
      },
    });
  }

  function handleClose(row: DouyinTransferOrderResult) {
    confirm({
      title: $t('payment.transfer.closeConfirmTitle'),
      content: $t('payment.transfer.closeConfirmContent'),
      okType: 'danger',
      okText: $t('payment.transfer.action.close'),
      onOk() {
        return TransferApi.close('douyin', row.id!).then(() => {
          message.success($t('payment.transfer.closeSuccess'));
          queryPage();
        });
      },
    });
  }

  // 重试: 仅 FAIL 单, 跳转发起页预填原单参数重新发起
  function handleRetry(row: DouyinTransferOrderResult) {
    drawerVisible.value = false;
    router.push({
      path: '/trade/transfer/create',
      query: {
        channel: 'douyin',
        channelMchNo: row.channelMchNo ?? '',
        bizTransferNo: row.bizTransferNo,
        amount: formatAmount(row.amount),
        // 收款人账号/姓名为敏感信息, 重试时强制重新输入, 不回填
        title: row.title,
        reason: row.reason,
        notifyUrl: row.notifyUrl,
        attach: row.attach,
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
      <div class="mb-3 flex items-center justify-between">
        <span class="text-lg font-medium">{{ $t('menu.trade.transfer.douyin') }}</span>
        <a-button v-if="hasPermission(PermCodes.Trade.Transfer.MANAGE)" type="primary" @click="openCreate">
          {{ $t('payment.transfer.action.create') }}
        </a-button>
      </div>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column
            field="transferNo"
            :title="$t('payment.transfer.field.transferNo')"
            :min-width="190"
            show-overflow
          />
          <vxe-column
            field="bizTransferNo"
            :title="$t('payment.transfer.field.bizTransferNo')"
            :min-width="160"
            show-overflow
          />
          <vxe-column
            field="payeeAccount"
            :title="$t('payment.transfer.field.payeeAccount')"
            :min-width="150"
            show-overflow
          />
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
                  v-if="hasPermission(PermCodes.Trade.Transfer.MANAGE) && row.status === 'processing'"
                  type="link"
                  size="small"
                  @click="handleSync(row)"
                >
                  {{ $t('payment.transfer.action.sync') }}
                </a-button>
                <a-dropdown
                  v-if="hasPermission(PermCodes.Trade.Transfer.MANAGE) && ['fail', 'processing'].includes(row.status!)"
                >
                  <a-button type="link" size="small" @click.prevent>
                    {{ $t('common.more') }}
                    <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                  </a-button>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item v-if="row.status === 'fail'" @click="handleRetry(row)">
                        {{ $t('payment.transfer.action.retry') }}
                      </a-menu-item>
                      <a-menu-item v-if="row.status === 'processing'" danger @click="handleClose(row)">
                        {{ $t('payment.transfer.action.close') }}
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

    <!-- 详情抽屉 -->
    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('payment.transfer.detail')"
      :size="680"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <div class="mb-4 text-sm font-medium">{{ $t('payment.transfer.section.identity') }}</div>
        <a-descriptions :column="2" size="small" bordered class="mb-4">
          <a-descriptions-item :label="$t('payment.transfer.field.merchant')">
            {{ detail.mchName || detail.mchNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.appId')">
            {{ detail.appId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.transferNo')">
            {{ detail.transferNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.bizTransferNo')">
            {{ detail.bizTransferNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.outTransferNo')" :span="2">
            {{ detail.outTransferNo || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="mb-4 text-sm font-medium">{{ $t('payment.transfer.section.amount') }}</div>
        <a-descriptions :column="2" size="small" bordered class="mb-4">
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
          <a-descriptions-item :label="$t('payment.transfer.field.reason')" :span="2">
            {{ detail.reason || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.finishTime')">
            {{ formatDateTime(detail.finishTime) || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.createTime')">
            {{ formatDateTime(detail.createTime) || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="mb-4 text-sm font-medium">{{ $t('payment.transfer.section.payee') }}</div>
        <a-descriptions :column="2" size="small" bordered class="mb-4">
          <a-descriptions-item :label="$t('payment.transfer.field.payeeAccount')" :span="2">
            {{ detail.payeeAccount || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.payeeName')">
            {{ detail.payeeName || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.transferScene')">
            {{ detail.transferScene || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="mb-4 text-sm font-medium">{{ $t('payment.transfer.section.notify') }}</div>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('payment.transfer.field.notifyUrl')" :span="2">
            {{ detail.notifyUrl || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.attach')" :span="2">
            {{ detail.attach || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.errorMsg')" :span="2">
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
