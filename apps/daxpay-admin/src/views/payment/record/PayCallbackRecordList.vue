<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    PayCallbackRecordApi,
    type PayCallbackRecordQuery,
    type PayCallbackRecordResult,
  } from '#/api/payment/record/callback-record.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { useDict } from '#/hooks/useDict';

  defineOptions({ name: 'PayCallbackRecordList' });

  const { dictConvert, dictItems: channelOptions } = useDict('channel');
  const { dictItems: statusOptions } = useDict('callback_status');

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const queryForm = ref<PayCallbackRecordQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<PayCallbackRecordResult[]>([]);

  const drawerVisible = ref(false);
  const detail = ref<PayCallbackRecordResult>({});

  const callbackTypeOptions = computed(() => [
    // 支付
    { label: $t('payment.record.callbackRecord.typePay'), value: 'pay' },
    // 退款
    { label: $t('payment.record.callbackRecord.typeRefund'), value: 'refund' },
  ]);

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'channelMchNo',
      // 通道商户号
      name: $t('payment.record.callbackRecord.channelMchNo'),
      placeholder: $t('payment.record.callbackRecord.placeholderChannelMchNo'),
    },
    {
      type: 'string',
      field: 'tradeNo',
      // 交易号
      name: $t('payment.record.callbackRecord.tradeNo'),
      placeholder: $t('payment.record.callbackRecord.placeholderTradeNo'),
    },
    {
      type: 'string',
      field: 'outTradeNo',
      // 通道交易号
      name: $t('payment.record.callbackRecord.outTradeNo'),
      placeholder: $t('payment.record.callbackRecord.placeholderOutTradeNo'),
    },
    {
      type: 'select',
      field: 'channel',
      // 支付通道
      name: $t('payment.record.callbackRecord.channel'),
      options: channelOptions.value,
    },
    {
      type: 'select',
      field: 'callbackType',
      // 回调类型
      name: $t('payment.record.callbackRecord.callbackType'),
      options: callbackTypeOptions.value,
    },
    {
      type: 'select',
      field: 'status',
      // 处理状态
      name: $t('payment.record.callbackRecord.status'),
      options: statusOptions.value,
    },
    {
      type: 'string',
      field: 'mchNo',
      name: $t('payment.order.field.merchant'),
    },
  ]);

  function callbackTypeLabel(type?: string) {
    if (type === 'pay') return $t('payment.record.callbackRecord.typePay');
    if (type === 'refund') return $t('payment.record.callbackRecord.typeRefund');
    return type || '-';
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
      const { data } = await PayCallbackRecordApi.page({
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

  async function handleView(row: PayCallbackRecordResult) {
    drawerVisible.value = true;
    detail.value = row;
    if (row.id) {
      const { data } = await PayCallbackRecordApi.getById(row.id);
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
          <vxe-column field="mchName" :title="$t('payment.order.field.merchant')" :min-width="140">
            <template #default="{ row }">
              <div class="flex flex-col">
                <span>{{ row.mchName || row.mchNo || '-' }}</span>
                <span v-if="row.mchNo" class="text-xs text-muted-foreground">{{ row.mchNo }}</span>
              </div>
            </template>
          </vxe-column>
          <vxe-column
            field="channelMchNo"
            :title="$t('payment.record.callbackRecord.channelMchNo')"
            :min-width="160"
            show-overflow
          />
          <vxe-column
            field="tradeNo"
            :title="$t('payment.record.callbackRecord.tradeNo')"
            :min-width="200"
            show-overflow
          />
          <vxe-column
            field="outTradeNo"
            :title="$t('payment.record.callbackRecord.outTradeNo')"
            :min-width="200"
            show-overflow
          />
          <vxe-column field="channel" :title="$t('payment.record.callbackRecord.channel')" :min-width="120">
            <template #default="{ row }">
              {{ dictConvert('channel', row.channel) || row.channel || '-' }}
            </template>
          </vxe-column>
          <vxe-column
            field="callbackType"
            :title="$t('payment.record.callbackRecord.callbackType')"
            :min-width="100"
          >
            <template #default="{ row }">{{ callbackTypeLabel(row.callbackType) }}</template>
          </vxe-column>
          <vxe-column field="status" :title="$t('payment.record.callbackRecord.status')" :min-width="110">
            <template #default="{ row }">
              {{ dictConvert('callback_status', row.status) || row.status || '-' }}
            </template>
          </vxe-column>
          <vxe-column
            field="errorMsg"
            :title="$t('payment.record.callbackRecord.errorMsg')"
            :min-width="180"
            show-overflow
          />
          <vxe-column
            field="createTime"
            :title="$t('payment.record.callbackRecord.createTime')"
            :min-width="170"
            formatter="formatDateTime"
          />
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
      :title="$t('payment.record.callbackRecord.detail')"
      width="720"
      destroy-on-close
    >
      <div class="mb-4 space-y-2 text-sm">
        <div>{{ $t('payment.record.callbackRecord.tradeNo') }}: {{ detail.tradeNo || '-' }}</div>
        <div>{{ $t('payment.record.callbackRecord.outTradeNo') }}: {{ detail.outTradeNo || '-' }}</div>
        <div>
          {{ $t('payment.record.callbackRecord.channelMchNo') }}: {{ detail.channelMchNo || '-' }}
        </div>
        <div>
          {{ $t('payment.record.callbackRecord.channel') }}:
          {{ dictConvert('channel', detail.channel) || detail.channel || '-' }}
        </div>
        <div>
          {{ $t('payment.record.callbackRecord.callbackType') }}: {{ callbackTypeLabel(detail.callbackType) }}
        </div>
        <div>
          {{ $t('payment.record.callbackRecord.status') }}:
          {{ dictConvert('callback_status', detail.status) || detail.status || '-' }}
        </div>
        <div v-if="detail.errorMsg">
          {{ $t('payment.record.callbackRecord.errorMsg') }}: {{ detail.errorMsg }}
        </div>
      </div>
      <div class="mb-2 text-sm font-medium">{{ $t('payment.record.callbackRecord.notifyInfo') }}</div>
      <pre class="max-h-[60vh] overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap break-all">{{
        formatNotifyInfo(detail.notifyInfo)
      }}</pre>
    </a-drawer>
  </div>
</template>
