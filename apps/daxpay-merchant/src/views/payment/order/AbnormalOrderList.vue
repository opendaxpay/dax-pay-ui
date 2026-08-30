<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import {
    AbnormalOrderApi,
    type AbnormalOrderQuery,
    type AbnormalOrderResult,
  } from '#/api/payment/order/abnormal-order.api';
  import { BQuery, type QueryField } from '#/components/query';

  defineOptions({ name: 'AbnormalOrderList' });

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const queryForm = ref<AbnormalOrderQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<AbnormalOrderResult[]>([]);

  const drawerVisible = ref(false);
  const detail = ref<AbnormalOrderResult>({});

  // 异常类型选项(前端枚举, 不依赖后端字典)
  const abnormalTypeOptions = computed(() => [
    // 关单后收款
    { label: $t('payment.order.abnormalOrder.typeClosePaid'), value: 'close_paid' },
    // 失败后收款
    { label: $t('payment.order.abnormalOrder.typeFailPaid'), value: 'fail_paid' },
    // 撤销后收款
    { label: $t('payment.order.abnormalOrder.typeCancelPaid'), value: 'cancel_paid' },
  ]);

  // 发现来源选项
  const sourceOptions = computed(() => [
    // 通道回调
    { label: $t('payment.order.abnormalOrder.sourceCallback'), value: 'callback' },
    // 同步查单
    { label: $t('payment.order.abnormalOrder.sourceSync'), value: 'sync' },
    // 定时任务
    { label: $t('payment.order.abnormalOrder.sourceJob'), value: 'job' },
  ]);

  // 处理状态选项
  const handleStatusOptions = computed(() => [
    // 待处理
    { label: $t('payment.order.abnormalOrder.statusPending'), value: 'pending' },
    // 已确认成功
    { label: $t('payment.order.abnormalOrder.statusConfirmed'), value: 'confirmed' },
    // 已忽略
    { label: $t('payment.order.abnormalOrder.statusIgnored'), value: 'ignored' },
  ]);

  const queryFields = computed<QueryField[]>(() => [
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
      // 商户订单号
      name: $t('payment.order.field.bizOrderNo'),
      placeholder: $t('payment.order.placeholder.bizOrderNo'),
    },
    {
      type: 'list',
      field: 'abnormalType',
      // 异常类型
      name: $t('payment.order.abnormalOrder.abnormalType'),
      selectList: abnormalTypeOptions.value,
    },
    {
      type: 'list',
      field: 'source',
      // 发现来源
      name: $t('payment.order.abnormalOrder.sourceLabel'),
      selectList: sourceOptions.value,
    },
    {
      type: 'list',
      field: 'handleStatus',
      // 处理状态
      name: $t('payment.order.abnormalOrder.handleStatusLabel'),
      selectList: handleStatusOptions.value,
    },
    {
      type: 'string',
      field: 'outOrderNo',
      // 通道订单号
      name: $t('payment.order.field.outOrderNo'),
    },
  ]);

  function abnormalTypeLabel(type?: string) {
    const hit = abnormalTypeOptions.value.find((o) => o.value === type);
    return hit ? hit.label : type || '-';
  }

  function sourceLabel(source?: string) {
    const hit = sourceOptions.value.find((o) => o.value === source);
    return hit ? hit.label : source || '-';
  }

  // 资金状态翻译(复用资金凭证状态词条)
  function fundStatusLabel(status?: string): string {
    if (!status) return '-';
    return $t(`payment.order.fundStatus.${status}`);
  }

  // 处理状态颜色
  function handleStatusColor(status?: string): string {
    if (status === 'pending') return 'warning';
    if (status === 'confirmed') return 'success';
    return 'default';
  }

  // 处理状态翻译
  function handleStatusLabel(status?: string): string {
    if (status === 'pending') return $t('payment.order.abnormalOrder.statusPending');
    if (status === 'confirmed') return $t('payment.order.abnormalOrder.statusConfirmed');
    if (status === 'ignored') return $t('payment.order.abnormalOrder.statusIgnored');
    return status || '-';
  }

  // 金额分转元
  function formatAmount(amount?: number): string {
    if (amount === null || amount === undefined) return '-';
    return (amount / 100).toFixed(2);
  }

  function formatNotifyInfo(raw?: string) {
    if (!raw) return '-';
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  async function queryPage() {
    loading.value = true;
    try {
      const { data } = await AbnormalOrderApi.page({
        ...queryForm.value,
        current: pageConfig.value.currentPage,
        size: pageConfig.value.pageSize,
      });
      tableData.value = data?.records || [];
      pageConfig.value.total = Number(data?.total || 0);
    } finally {
      loading.value = false;
    }
  }

  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  async function handleView(row: AbnormalOrderResult) {
    drawerVisible.value = true;
    detail.value = row;
    if (row.id) {
      const { data } = await AbnormalOrderApi.getById(row.id);
      if (data) {
        detail.value = data;
      }
    }
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
          <vxe-column field="bizOrderNo" :title="$t('payment.order.field.bizOrderNo')" :min-width="170" show-overflow />
          <vxe-column field="amount" :title="$t('payment.order.field.amount')" :min-width="110" align="right">
            <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
          </vxe-column>
          <vxe-column field="abnormalType" :title="$t('payment.order.abnormalOrder.abnormalType')" :min-width="120">
            <template #default="{ row }">
              <a-tag color="error">{{ abnormalTypeLabel(row.abnormalType) }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="tradeStatus" :title="$t('payment.order.field.fundStatus')" :min-width="100" align="center">
            <template #default="{ row }">{{ fundStatusLabel(row.tradeStatus) }}</template>
          </vxe-column>
          <vxe-column field="source" :title="$t('payment.order.abnormalOrder.sourceLabel')" :min-width="100">
            <template #default="{ row }">{{ sourceLabel(row.source) }}</template>
          </vxe-column>
          <vxe-column
            field="createTime"
            :title="$t('payment.order.field.createTime')"
            :min-width="170"
            formatter="formatDateTime"
          />
          <vxe-column
            field="handleStatus"
            :title="$t('payment.order.abnormalOrder.handleStatusLabel')"
            :min-width="110"
            align="center"
          >
            <template #default="{ row }">
              <a-tag :color="handleStatusColor(row.handleStatus)">
                {{ handleStatusLabel(row.handleStatus) }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column fixed="right" :width="100" :show-overflow="false" :title="$t('common.operation')">
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
          @page-change="
            ({ currentPage, pageSize }) => {
              pageConfig.currentPage = currentPage;
              pageConfig.pageSize = pageSize;
              queryPage();
            }
          "
        />
      </a-card>
    </div>

    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('payment.order.abnormalOrder.detail')"
      width="720"
      destroy-on-close
    >
      <div class="mb-4 space-y-2 text-sm">
        <div>{{ $t('payment.order.field.tradeNo') }}: {{ detail.tradeNo || '-' }}</div>
        <div>{{ $t('payment.order.field.bizOrderNo') }}: {{ detail.bizOrderNo || '-' }}</div>
        <div>{{ $t('payment.order.field.title') }}: {{ detail.title || '-' }}</div>
        <div>{{ $t('payment.order.field.amount') }}: {{ formatAmount(detail.amount) }}</div>
        <div>
          {{ $t('payment.order.abnormalOrder.abnormalType') }}:
          <a-tag color="error">{{ abnormalTypeLabel(detail.abnormalType) }}</a-tag>
        </div>
        <div> {{ $t('payment.order.field.fundStatus') }}: {{ fundStatusLabel(detail.tradeStatus) }} </div>
        <div> {{ $t('payment.order.abnormalOrder.sourceLabel') }}: {{ sourceLabel(detail.source) }} </div>
        <div>{{ $t('payment.order.field.outOrderNo') }}: {{ detail.outOrderNo || '-' }}</div>
        <div>
          {{ $t('payment.order.abnormalOrder.channelStatusLabel') }}:
          {{ fundStatusLabel(detail.channelStatus) }}
        </div>
        <div>
          {{ $t('payment.order.abnormalOrder.handleStatusLabel') }}:
          {{ handleStatusLabel(detail.handleStatus) }}
        </div>
        <div v-if="detail.handler"> {{ $t('payment.order.abnormalOrder.handler') }}: {{ detail.handler }} </div>
        <div v-if="detail.handleTime">
          {{ $t('payment.order.abnormalOrder.handleTime') }}:
          {{ formatDateTime(detail.handleTime) || '-' }}
        </div>
        <div v-if="detail.handleRemark">
          {{ $t('payment.order.abnormalOrder.handleRemark') }}: {{ detail.handleRemark }}
        </div>
      </div>
      <template v-if="detail.callbackNotifyInfo">
        <div class="mb-2 text-sm font-medium">{{ $t('payment.order.abnormalOrder.notifyInfo') }}</div>
        <pre class="max-h-[50vh] overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap break-all">{{
          formatNotifyInfo(detail.callbackNotifyInfo)
        }}</pre>
      </template>
    </a-drawer>
  </div>
</template>
