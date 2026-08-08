<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import {
    TransferApi,
    type WechatTransferOrderQuery,
    type WechatTransferOrderResult,
  } from '#/api/payment/transfer/transfer.api';
  import { QrCode } from '#/components/qrcode';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'WechatTransferList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  const queryForm = ref<WechatTransferOrderQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<WechatTransferOrderResult[]>([]);

  // 详情抽屉
  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<WechatTransferOrderResult>({});

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
      field: 'payeeOpenid',
      name: $t('payment.transfer.field.payeeOpenid'),
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
    return TransferApi.wechatPage({
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

  async function handleView(row: WechatTransferOrderResult) {
    drawerVisible.value = true;
    drawerLoading.value = true;
    try {
      const { data } = await TransferApi.wechatGetById(row.id!);
      detail.value = data || {};
    } finally {
      drawerLoading.value = false;
    }
  }

  function handleSync(row: WechatTransferOrderResult) {
    confirm({
      title: $t('payment.transfer.syncConfirmTitle'),
      content: $t('payment.transfer.syncConfirmContent'),
      onOk() {
        return TransferApi.sync('wechat', row.id!).then(() => {
          message.success($t('payment.transfer.syncSuccess'));
          queryPage();
        });
      },
    });
  }

  function handleClose(row: WechatTransferOrderResult) {
    confirm({
      title: $t('payment.transfer.closeConfirmTitle'),
      content: $t('payment.transfer.closeConfirmContent'),
      okType: 'danger',
      okText: $t('payment.transfer.action.close'),
      onOk() {
        return TransferApi.close('wechat', row.id!).then(() => {
          message.success($t('payment.transfer.closeSuccess'));
          queryPage();
        });
      },
    });
  }

  function handleDrawerClose() {
    drawerVisible.value = false;
    detail.value = {};
  }

  /** 复制确认收款链接 */
  function onCopyConfirmUrl() {
    message.success($t('payment.transfer.confirmUrlCopied'));
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
            field="payeeOpenid"
            :title="$t('payment.transfer.field.payeeOpenid')"
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
          <vxe-column :title="$t('common.operation')" :width="220" fixed="right" :show-overflow="false">
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
                <a-button
                  v-if="hasPermission(PermCodes.Trade.Transfer.MANAGE) && row.status === 'processing'"
                  type="link"
                  size="small"
                  danger
                  @click="handleClose(row)"
                >
                  {{ $t('payment.transfer.action.close') }}
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
      :title="$t('payment.transfer.detail')"
      :width="900"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <div class="mb-4 text-sm font-medium">{{ $t('payment.transfer.section.identity') }}</div>
        <a-descriptions :column="2" size="small" bordered class="transfer-desc mb-4">
          <a-descriptions-item :label="$t('payment.transfer.field.merchant')">
            {{ detail.mchName || detail.mchNo || '-' }}
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
        <a-descriptions :column="2" size="small" bordered class="transfer-desc mb-4">
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
        <a-descriptions :column="2" size="small" bordered class="transfer-desc mb-4">
          <a-descriptions-item :label="$t('payment.transfer.field.payeeOpenid')" :span="2">
            {{ detail.payeeOpenid || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.userName')">
            {{ detail.userName || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.transferScene')">
            {{ detail.transferScene || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.transfer.field.transferBody')" :span="2">
            {{ detail.transferBody || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 接收地址(仅待领取状态返回) -->
        <template v-if="detail.confirmUrl">
          <div class="mb-4 text-sm font-medium">{{ $t('payment.transfer.section.confirmUrl') }}</div>
          <div class="mb-4 flex gap-4 items-start rounded-lg border border-border p-4">
            <div class="shrink-0">
              <QrCode :value="detail.confirmUrl" :width="160" :margin="0" />
            </div>
            <div class="flex flex-1 flex-col justify-center min-w-0">
              <a-typography-paragraph
                :copyable="{ text: detail.confirmUrl, onCopy: onCopyConfirmUrl }"
                class="text-sm text-muted-foreground break-all"
              >
                {{ detail.confirmUrl }}
              </a-typography-paragraph>
              <div class="mt-2 text-xs text-muted-foreground">
                {{ $t('payment.transfer.confirmUrlTip') }}
              </div>
            </div>
          </div>
        </template>

        <div class="mb-4 text-sm font-medium">{{ $t('payment.transfer.section.notify') }}</div>
        <a-descriptions :column="2" size="small" bordered class="transfer-desc">
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

<style scoped>
  /* 标题列按内容撑开，避免多语言下 label 文案过长被压窄折行 */
  .transfer-desc :deep(.ant-descriptions-item-label) {
    width: 1%;
    white-space: nowrap;
  }
</style>
