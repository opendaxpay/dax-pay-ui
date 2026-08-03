<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

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

  // 任务列表
  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const queryForm = ref<MchNoticeTaskQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<MchNoticeTaskResult[]>([]);

  // 任务详情抽屉
  const taskDrawerVisible = ref(false);
  const taskDetailLoading = ref(false);
  const taskDetail = ref<MchNoticeTaskResult>({});

  // 发送记录抽屉
  const recordDrawerVisible = ref(false);
  const recordTask = ref<MchNoticeTaskResult>({});
  const recordLoading = ref(false);
  const records = ref<MchNoticeRecordResult[]>([]);

  // 发送记录详情弹窗
  const recordModalVisible = ref(false);
  const currentRecord = ref<MchNoticeRecordResult>({});

  // 重发 loading
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
    {
      type: 'string',
      field: 'mchNo',
      name: $t('payment.order.field.merchant'),
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

  // 发送类型翻译
  function sendTypeLabel(sendType?: string) {
    if (sendType === 'auto') return $t('payment.notice.mchNotice.sendTypeAuto');
    if (sendType === 'manual') return $t('payment.notice.mchNotice.sendTypeManual');
    return sendType || '-';
  }

  // JSON 内容美化展示
  function formatContent(content?: string) {
    if (!content) return '-';
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
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

  // 查看任务详情(点击业务单号)
  async function handleView(row: MchNoticeTaskResult) {
    taskDrawerVisible.value = true;
    taskDetailLoading.value = true;
    try {
      const { data } = await MchNoticeApi.getTaskById(row.id!);
      taskDetail.value = data || {};
    } finally {
      taskDetailLoading.value = false;
    }
  }

  // 打开发送记录列表
  async function handleViewRecords(row: MchNoticeTaskResult) {
    recordDrawerVisible.value = true;
    recordTask.value = row;
    recordLoading.value = true;
    try {
      const { data } = await MchNoticeApi.pageRecord({
        taskId: row.id ?? undefined,
        current: 1,
        size: 50,
      });
      records.value = data?.records || [];
    } finally {
      recordLoading.value = false;
    }
  }

  // 查看单条发送记录详情
  function handleViewRecord(record: MchNoticeRecordResult) {
    currentRecord.value = record;
    recordModalVisible.value = true;
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
          <vxe-column field="bizNo" :title="$t('payment.notice.mchNotice.bizNo')" :min-width="180">
            <template #default="{ row }">
              <!-- 点击业务单号查看任务详情 -->
              <a href="javascript:" class="vben-link" @click="handleView(row)">{{ row.bizNo }}</a>
            </template>
          </vxe-column>
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
          <vxe-column field="mchName" :title="$t('payment.order.field.merchant')" :min-width="140">
            <template #default="{ row }">
              <div class="flex flex-col">
                <span>{{ row.mchName || row.mchNo || '-' }}</span>
                <span v-if="row.mchNo" class="text-xs text-muted-foreground">{{ row.mchNo }}</span>
              </div>
            </template>
          </vxe-column>
          <vxe-column
            field="latestTime"
            :title="$t('payment.notice.mchNotice.latestTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" :width="180" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleViewRecords(row)">
                  {{ $t('payment.notice.mchNotice.records') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.Trade.Notice.MANAGE)"
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

    <!-- 任务详情抽屉 -->
    <a-drawer
      v-model:open="taskDrawerVisible"
      :title="$t('payment.notice.mchNotice.taskDetail')"
      width="1080"
      destroy-on-close
    >
      <a-spin :spinning="taskDetailLoading">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item :label="$t('payment.order.field.merchant')">
            {{ taskDetail.mchName || taskDetail.mchNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.notice.mchNotice.bizNo')">
            {{ taskDetail.bizNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.notice.mchNotice.event')">
            {{ taskDetail.event || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.notice.mchNotice.protocol')">
            {{ protocolLabel(taskDetail.protocol) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.notice.mchNotice.source')">
            {{ sourceLabel(taskDetail.source) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.notice.mchNotice.success')">
            <a-tag :color="taskDetail.success ? 'success' : 'default'">
              {{ taskDetail.success ? $t('payment.notice.mchNotice.yes') : $t('payment.notice.mchNotice.no') }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.notice.mchNotice.sendCount')">
            {{ taskDetail.sendCount ?? 0 }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.notice.mchNotice.delayCount')">
            {{ taskDetail.delayCount ?? 0 }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.notice.mchNotice.latestTime')" :span="2">
            {{ formatDateTime(taskDetail.latestTime) || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.notice.mchNotice.nextTime')" :span="2">
            {{ formatDateTime(taskDetail.nextTime) || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.notice.mchNotice.url')" :span="2">
            {{ taskDetail.url || '-' }}
          </a-descriptions-item>
          <a-descriptions-item v-if="taskDetail.errorMsg" :label="$t('payment.notice.mchNotice.errorMsg')" :span="2">
            {{ taskDetail.errorMsg }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.notice.mchNotice.content')" :span="2">
            <pre v-if="taskDetail.content" class="notice-json-pre">{{ formatContent(taskDetail.content) }}</pre>
            <span v-else>-</span>
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>
    </a-drawer>

    <!-- 发送记录抽屉 -->
    <a-drawer
      v-model:open="recordDrawerVisible"
      :title="$t('payment.notice.mchNotice.records')"
      width="1080"
      destroy-on-close
    >
      <div class="mb-4 space-y-2 text-sm">
        <div>{{ $t('payment.notice.mchNotice.bizNo') }}: {{ recordTask.bizNo }}</div>
        <div>{{ $t('payment.notice.mchNotice.event') }}: {{ recordTask.event }}</div>
        <div>{{ $t('payment.notice.mchNotice.url') }}: {{ recordTask.url }}</div>
        <div v-if="recordTask.errorMsg"> {{ $t('payment.notice.mchNotice.errorMsg') }}: {{ recordTask.errorMsg }} </div>
      </div>
      <vxe-table :data="records" :loading="recordLoading" :row-config="{ keyField: 'id' }">
        <vxe-column field="reqCount" :title="$t('payment.notice.mchNotice.reqCount')" width="70" align="center" />
        <vxe-column field="sendType" :title="$t('payment.notice.mchNotice.sendType')" width="100">
          <template #default="{ row }">{{ sendTypeLabel(row.sendType) }}</template>
        </vxe-column>
        <vxe-column field="success" :title="$t('payment.notice.mchNotice.success')" width="90" align="center">
          <template #default="{ row }">
            <a-tag :color="row.success ? 'success' : 'error'">
              {{ row.success ? $t('payment.notice.mchNotice.yes') : $t('payment.notice.mchNotice.no') }}
            </a-tag>
          </template>
        </vxe-column>
        <vxe-column field="httpStatus" :title="$t('payment.notice.mchNotice.httpStatus')" width="100" />
        <vxe-column field="errorMsg" :title="$t('payment.notice.mchNotice.errorMsg')" :min-width="160" show-overflow />
        <vxe-column
          field="createTime"
          :title="$t('payment.order.field.createTime')"
          :min-width="160"
          formatter="formatDateTime"
        />
        <vxe-column fixed="right" :width="100" :show-overflow="false" :title="$t('common.operation')">
          <template #default="{ row }">
            <a-button type="link" size="small" @click="handleViewRecord(row)">
              {{ $t('common.view') }}
            </a-button>
          </template>
        </vxe-column>
      </vxe-table>
    </a-drawer>

    <!-- 发送记录详情弹窗 -->
    <a-modal
      v-model:open="recordModalVisible"
      :title="$t('payment.notice.mchNotice.recordDetail')"
      width="720"
      destroy-on-close
      :footer="null"
    >
      <a-descriptions :column="2" bordered size="small">
        <a-descriptions-item :label="$t('payment.notice.mchNotice.reqCount')">
          {{ currentRecord.reqCount ?? '-' }}
        </a-descriptions-item>
        <a-descriptions-item :label="$t('payment.notice.mchNotice.sendType')">
          {{ sendTypeLabel(currentRecord.sendType) }}
        </a-descriptions-item>
        <a-descriptions-item :label="$t('payment.notice.mchNotice.success')">
          <a-tag :color="currentRecord.success ? 'success' : 'error'">
            {{ currentRecord.success ? $t('payment.notice.mchNotice.yes') : $t('payment.notice.mchNotice.no') }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item :label="$t('payment.notice.mchNotice.httpStatus')">
          {{ currentRecord.httpStatus ?? '-' }}
        </a-descriptions-item>
        <a-descriptions-item v-if="currentRecord.errorMsg" :label="$t('payment.notice.mchNotice.errorMsg')" :span="2">
          {{ currentRecord.errorMsg }}
        </a-descriptions-item>
        <a-descriptions-item :label="$t('payment.notice.mchNotice.requestDigest')" :span="2">
          <pre v-if="currentRecord.requestDigest" class="notice-json-pre">{{
            formatContent(currentRecord.requestDigest)
          }}</pre>
          <span v-else>-</span>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<style scoped>
  .notice-json-pre {
    max-height: 360px;
    margin: 0;
    padding: 12px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-all;
    background-color: #f6f8fa;
    border-radius: 6px;
  }
</style>
