<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, reactive, ref } from 'vue';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { MailRecordApi, type MailRecord } from '#/api/system/notify/mail-record.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);

  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 发送状态选项
  const statusOptions = [
    { label: $t('system.notify.mail.statusSending'), value: 'sending' },
    { label: $t('system.notify.mail.statusSuccess'), value: 'success' },
    { label: $t('system.notify.mail.statusFail'), value: 'fail' },
  ];

  // 业务场景选项
  const businessTypeOptions = [
    { label: $t('system.notify.mail.businessTest'), value: 'test' },
    { label: $t('system.notify.mail.businessManual'), value: 'manual' },
  ];

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'receiverEmail',
      name: $t('system.notify.mail.receiverEmail'),
      placeholder: $t('system.notify.mail.inputReceiverEmail'),
    },
    {
      type: 'list',
      field: 'status',
      name: $t('system.notify.mail.status'),
      selectList: statusOptions,
    },
    {
      type: 'list',
      field: 'businessType',
      name: $t('system.notify.mail.businessType'),
      selectList: businessTypeOptions,
    },
  ]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 表格数据
  const tableData = ref<any[]>([]);

  // 详情弹窗状态
  const detailModal = reactive({
    visible: false,
    record: {} as MailRecord,
  });

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    MailRecordApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res: any) => {
        tableData.value = res.data.records || [];
        pageConfig.value.total = Number(res.data.total) || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
    return Promise.resolve();
  }

  /**
   * 重置查询
   */
  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /**
   * 查看详情
   */
  async function handleView(row: any) {
    const { data } = await MailRecordApi.findById(row.id);
    detailModal.record = data || {};
    detailModal.visible = true;
  }

  /**
   * 失败重发
   */
  function handleResend(row: any) {
    confirm({
      title: $t('system.notify.mail.resend'),
      content: $t('system.notify.mail.confirmResend'),
      onOk: () => {
        MailRecordApi.resend(row.id).then(() => {
          message.success($t('common.saveSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 删除
   */
  function handleDelete(row: any) {
    confirm({
      title: $t('common.delete'),
      content: $t('system.notify.mail.confirmDelete'),
      onOk: () => {
        MailRecordApi.delete(row.id).then(() => {
          message.success($t('common.deleteSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 操作列更多菜单(重发仅失败状态可用, 删除为危险操作)
   */
  function getActionMenu(row: any): MenuProps {
    return {
      items: [
        // 重发
        {
          key: 'resend',
          label: $t('system.notify.mail.resend'),
          disabled:
            row.status !== 'fail' || !hasPermission(PermCodes.System.MailRecord.RESEND),
        },
        { type: 'divider' },
        // 删除
        {
          key: 'delete',
          label: $t('common.delete'),
          danger: true,
          disabled: !hasPermission(PermCodes.System.MailRecord.MANAGE),
        },
      ],
      onClick: ({ key }: { key: string }) => {
        if (key === 'resend') {
          handleResend(row);
        } else if (key === 'delete') {
          handleDelete(row);
        }
      },
    };
  }

  /**
   * 分页变化
   */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }
</script>

<template>
  <div class="m-3 list-page-compact rounded-lg bg-background p-3">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
        <!-- 数据表格 -->
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 序号 -->
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 收件邮箱 -->
          <vxe-column field="receiverEmail" :title="$t('system.notify.mail.receiverEmail')" :min-width="200" />
          <!-- 主题 -->
          <vxe-column field="subject" :title="$t('system.notify.mail.subjectField')" :min-width="200" show-overflow />
          <!-- 业务场景 -->
          <vxe-column field="businessType" :title="$t('system.notify.mail.businessType')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.businessType === 'test'" color="blue">
                {{ $t('system.notify.mail.businessTest') }}
              </a-tag>
              <a-tag v-else>{{ $t('system.notify.mail.businessManual') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 发送状态 -->
          <vxe-column field="status" :title="$t('system.notify.mail.status')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.status === 'success'" color="green">
                {{ $t('system.notify.mail.statusSuccess') }}
              </a-tag>
              <a-tag v-else-if="row.status === 'fail'" color="red">
                {{ $t('system.notify.mail.statusFail') }}
              </a-tag>
              <a-tag v-else color="processing">
                {{ $t('system.notify.mail.statusSending') }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 重试次数 -->
          <vxe-column field="retryCount" :title="$t('system.notify.mail.retryCount')" :min-width="90" align="center" />
          <!-- 发送时间 -->
          <vxe-column
            field="sendTime"
            :title="$t('system.notify.mail.sendTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <!-- 创建时间 -->
          <vxe-column
            field="createTime"
            :title="$t('system.notify.mail.createTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <!-- 操作 -->
          <vxe-column fixed="right" width="160" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <!-- 查看 -->
                <a-button
                  v-if="hasPermission(PermCodes.System.MailRecord.VIEW)"
                  type="link"
                  size="small"
                  @click="handleView(row)"
                >
                  {{ $t('common.view') }}
                </a-button>
                <!-- 更多(重发/删除) -->
                <a-dropdown :menu="getActionMenu(row)">
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
          :total="Number(pageConfig.total)"
          @page-change="handlePageChange"
        />
      </a-card>
    </div>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:open="detailModal.visible"
      :title="$t('system.notify.mail.detailTitle')"
      :footer="null"
      width="640px"
    >
      <!-- 描述列表: 间距类加 wrapper 避免被组件 cssinjs 样式覆盖 -->
      <div class="mb-4">
        <a-descriptions :column="1" bordered size="small">
          <!-- 收件邮箱 -->
          <a-descriptions-item :label="$t('system.notify.mail.receiverEmail')">
            {{ detailModal.record.receiverEmail }}
          </a-descriptions-item>
          <!-- 主题 -->
          <a-descriptions-item :label="$t('system.notify.mail.subjectField')">
            {{ detailModal.record.subject }}
          </a-descriptions-item>
          <!-- 业务场景 -->
          <a-descriptions-item :label="$t('system.notify.mail.businessType')">
            {{ detailModal.record.businessType === 'test' ? $t('system.notify.mail.businessTest') : $t('system.notify.mail.businessManual') }}
          </a-descriptions-item>
          <!-- 发送状态 -->
          <a-descriptions-item :label="$t('system.notify.mail.status')">
            {{ detailModal.record.status === 'success' ? $t('system.notify.mail.statusSuccess') : detailModal.record.status === 'fail' ? $t('system.notify.mail.statusFail') : $t('system.notify.mail.statusSending') }}
          </a-descriptions-item>
          <!-- 失败原因 -->
          <a-descriptions-item v-if="detailModal.record.status === 'fail'" :label="$t('system.notify.mail.errorMsg')">
            {{ detailModal.record.errorMsg || '-' }}
          </a-descriptions-item>
          <!-- 重试次数 -->
          <a-descriptions-item :label="$t('system.notify.mail.retryCount')">
            {{ detailModal.record.retryCount ?? 0 }}
          </a-descriptions-item>
          <!-- 发送时间 -->
          <a-descriptions-item :label="$t('system.notify.mail.sendTime')">
            {{ formatDateTime(detailModal.record.sendTime) || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
      <!-- 邮件正文(HTML 原文, 文本展示) -->
      <div class="detail-content">
        <div class="detail-content__title">{{ $t('system.notify.mail.contentField') }}</div>
        <pre class="detail-content__body">{{ detailModal.record.content || '-' }}</pre>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
  .detail-content__title {
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
  }

  .detail-content__body {
    max-height: 320px;
    padding: 12px;
    overflow: auto;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
    background: hsl(var(--muted) / 40%);
    border-radius: 8px;
  }
</style>
