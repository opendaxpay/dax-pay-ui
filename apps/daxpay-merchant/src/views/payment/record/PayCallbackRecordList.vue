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
  import { productI18nMap, productNameMap } from '#/enums/payment';

  defineOptions({ name: 'PayCallbackRecordList' });

  // 回调处理状态选项(前端枚举, 不依赖后端字典)
  const statusOptions = computed(() => [
    { label: $t('dict.callback_status.success'), value: 'success' },
    { label: $t('dict.callback_status.fail'), value: 'fail' },
    { label: $t('dict.callback_status.close'), value: 'close' },
    { label: $t('dict.callback_status.ignore'), value: 'ignore' },
    { label: $t('dict.callback_status.exception'), value: 'exception' },
    { label: $t('dict.callback_status.not_found'), value: 'not_found' },
  ]);

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
    // 转账
    { label: $t('payment.record.callbackRecord.typeTransfer'), value: 'transfer' },
    // 分账
    { label: $t('payment.record.callbackRecord.typeAlloc'), value: 'alloc' },
  ]);

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
      field: 'channelMchNo',
      // 通道商户
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
      type: 'list',
      field: 'product',
      // 支付产品
      name: $t('payment.order.field.product'),
      selectList: productOptions.value,
    },
    {
      type: 'list',
      field: 'callbackType',
      // 回调类型
      name: $t('payment.record.callbackRecord.callbackType'),
      selectList: callbackTypeOptions.value,
    },
    {
      type: 'list',
      field: 'status',
      // 处理状态
      name: $t('payment.record.callbackRecord.status'),
      selectList: statusOptions.value,
    },
  ]);

  function callbackTypeLabel(type?: string) {
    if (type === 'pay') return $t('payment.record.callbackRecord.typePay');
    if (type === 'refund') return $t('payment.record.callbackRecord.typeRefund');
    if (type === 'transfer') return $t('payment.record.callbackRecord.typeTransfer');
    if (type === 'alloc') return $t('payment.record.callbackRecord.typeAlloc');
    return type || '-';
  }

  // 回调处理状态翻译(前端 i18n, 不依赖后端字典)
  function statusLabel(code?: string): string {
    if (!code) return '-';
    const text = $t(`dict.callback_status.${code}`);
    return text || code;
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
          <vxe-column
            field="callbackType"
            :title="$t('payment.record.callbackRecord.callbackType')"
            :min-width="100"
          >
            <template #default="{ row }">{{ callbackTypeLabel(row.callbackType) }}</template>
          </vxe-column>
          <vxe-column field="status" :title="$t('payment.record.callbackRecord.status')" :min-width="110">
            <template #default="{ row }">
              {{ statusLabel(row.status) }}
            </template>
          </vxe-column>
          <vxe-column
            field="errorMsg"
            :title="$t('payment.record.callbackRecord.errorMsg')"
            :min-width="180"
            show-overflow
          />
          <vxe-column field="product" :title="$t('payment.order.field.product')" :min-width="140" show-overflow>
            <template #default="{ row }">{{ productLabel(row.product) }}</template>
          </vxe-column>
          <vxe-column
            field="channelMchNo"
            :title="$t('payment.record.callbackRecord.channelMchNo')"
            :min-width="160"
          >
            <template #default="{ row }">
              <div class="flex flex-col">
                <span>{{ row.channelMerchantName || row.channelMchNo || '-' }}</span>
                <span v-if="row.channelMchNo" class="text-xs text-muted-foreground">{{ row.channelMchNo }}</span>
              </div>
            </template>
          </vxe-column>
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
          {{ $t('payment.order.field.product') }}:
          {{ productLabel(detail.product) }}
        </div>
        <div>
          {{ $t('payment.record.callbackRecord.channelMchNo') }}:
          {{ detail.channelMerchantName || detail.channelMchNo || '-' }}
          <span v-if="detail.channelMerchantName && detail.channelMchNo" class="text-muted-foreground">
            ({{ detail.channelMchNo }})
          </span>
        </div>
        <div>
          {{ $t('payment.record.callbackRecord.callbackType') }}: {{ callbackTypeLabel(detail.callbackType) }}
        </div>
        <div>
          {{ $t('payment.record.callbackRecord.status') }}:
          {{ statusLabel(detail.status) }}
        </div>
        <div v-if="detail.errorMsg">
          {{ $t('payment.record.callbackRecord.errorMsg') }}: {{ detail.errorMsg }}
        </div>
      </div>
      <!-- 原始报文不下发, 引导商户联系平台客服 -->
      <div class="mt-4">
        <a-alert
          type="info"
          :message="$t('payment.record.callbackRecord.contactSupportForRawNotice')"
          banner
        />
      </div>
    </a-drawer>
  </div>
</template>
