<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    MchNoticeApi,
    type MchNoticeRecordResult,
    type MchNoticeTaskQuery,
    type MchNoticeTaskResult,
  } from '#/api/payment/notice/mch-notice.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'MchNoticeTaskList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const queryForm = ref<MchNoticeTaskQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<MchNoticeTaskResult[]>([]);

  const drawerVisible = ref(false);
  const detail = ref<MchNoticeTaskResult>({});
  const recordLoading = ref(false);
  const records = ref<MchNoticeRecordResult[]>([]);
  const actionLoading = ref(false);

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'bizNo',
      // 业务单号
      name: $t('payment.notice.mchNotice.bizNo'),
      placeholder: $t('payment.notice.mchNotice.placeholderBizNo'),
    },
    {
      type: 'string',
      field: 'event',
      // 事件
      name: $t('payment.notice.mchNotice.event'),
    },
    {
      type: 'string',
      field: 'protocol',
      // 协议
      name: $t('payment.notice.mchNotice.protocol'),
    },
  ]);

  function sourceLabel(source?: string) {
    if (source === 'order') return $t('payment.notice.mchNotice.sourceOrder');
    if (source === 'app') return $t('payment.notice.mchNotice.sourceApp');
    if (source === 'protocol') return $t('payment.notice.mchNotice.sourceProtocol');
    return source || '-';
  }

  function protocolLabel(protocol?: string) {
    if (protocol === 'system') return $t('payment.notice.mchNotice.protocolSystem');
    if (protocol === 'easy_pay') return $t('payment.notice.mchNotice.protocolEasyPay');
    return protocol || '-';
  }

  async function queryPage() {
    loading.value = true;
    try {
      const { data } = await MchNoticeApi.pageTask({
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

  async function handleView(row: MchNoticeTaskResult) {
    drawerVisible.value = true;
    detail.value = row;
    recordLoading.value = true;
    try {
      const { data } = await MchNoticeApi.pageRecord({
        taskId: row.id,
        current: 1,
        size: 50,
      });
      records.value = data?.records || [];
    } finally {
      recordLoading.value = false;
    }
  }

  function handleResend(row: MchNoticeTaskResult) {
    confirm({
      // 确认重发
      content: $t('payment.notice.mchNotice.confirmResend'),
      onOk() {
        actionLoading.value = true;
        return MchNoticeApi.resend(row.id!)
          .then(() => {
            message.success($t('common.success'));
            queryPage();
          })
          .finally(() => {
            actionLoading.value = false;
          });
      },
    });
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
          <vxe-column field="bizNo" :title="$t('payment.notice.mchNotice.bizNo')" :min-width="180" show-overflow />
          <vxe-column field="event" :title="$t('payment.notice.mchNotice.event')" :min-width="120" />
          <vxe-column field="protocol" :title="$t('payment.notice.mchNotice.protocol')" :min-width="100">
            <template #default="{ row }">{{ protocolLabel(row.protocol) }}</template>
          </vxe-column>
          <vxe-column field="source" :title="$t('payment.notice.mchNotice.source')" :min-width="90">
            <template #default="{ row }">{{ sourceLabel(row.source) }}</template>
          </vxe-column>
          <vxe-column field="success" :title="$t('payment.notice.mchNotice.success')" width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="row.success ? 'success' : 'default'">
                {{ row.success ? $t('payment.notice.mchNotice.yes') : $t('payment.notice.mchNotice.no') }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="sendCount" :title="$t('payment.notice.mchNotice.sendCount')" width="90" align="center" />
          <vxe-column
            field="latestTime"
            :title="$t('payment.notice.mchNotice.latestTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" :width="160" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleView(row)">
                  {{ $t('common.view') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.Trade.Notice.MANAGE) && !row.success"
                  type="link"
                  size="small"
                  :loading="actionLoading"
                  @click="handleResend(row)"
                >
                  {{ $t('payment.notice.mchNotice.resend') }}
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
      :title="$t('payment.notice.mchNotice.records')"
      width="720"
      destroy-on-close
    >
      <div class="mb-4 space-y-2 text-sm">
        <div>{{ $t('payment.notice.mchNotice.bizNo') }}: {{ detail.bizNo }}</div>
        <div>{{ $t('payment.notice.mchNotice.event') }}: {{ detail.event }}</div>
        <div>{{ $t('payment.notice.mchNotice.url') }}: {{ detail.url }}</div>
        <div v-if="detail.errorMsg">{{ $t('payment.notice.mchNotice.errorMsg') }}: {{ detail.errorMsg }}</div>
      </div>
      <vxe-table :data="records" :loading="recordLoading" :row-config="{ keyField: 'id' }">
        <vxe-column field="reqCount" :title="$t('payment.notice.mchNotice.reqCount')" width="70" align="center" />
        <vxe-column field="sendType" :title="$t('payment.notice.mchNotice.sendType')" width="90" />
        <vxe-column field="success" :title="$t('payment.notice.mchNotice.success')" width="90" align="center">
          <template #default="{ row }">
            <a-tag :color="row.success ? 'success' : 'error'">
              {{ row.success ? $t('payment.notice.mchNotice.yes') : $t('payment.notice.mchNotice.no') }}
            </a-tag>
          </template>
        </vxe-column>
        <vxe-column field="httpStatus" :title="$t('payment.notice.mchNotice.httpStatus')" width="100" />
        <vxe-column field="errorMsg" :title="$t('payment.notice.mchNotice.errorMsg')" min-width="160" show-overflow />
        <vxe-column field="createTime" :title="$t('payment.order.field.createTime')" min-width="160" formatter="formatDateTime" />
      </vxe-table>
    </a-drawer>
  </div>
</template>
