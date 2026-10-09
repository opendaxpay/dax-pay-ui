<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, reactive, ref } from 'vue';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { type MailRecord, MailRecordApi } from '#/api/system/notify/mail-record.api';
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
    { label: $t('system.notify.mail.businessPasswordReset'), value: 'password_reset' },
    { label: $t('system.notify.mail.businessEmailBind'), value: 'email_bind' },
    { label: $t('system.notify.mail.businessEmailChangeNotice'), value: 'email_change_notice' },
    { label: $t('system.notify.mail.businessPasswordResetNotice'), value: 'password_reset_notice' },
    { label: $t('system.notify.mail.businessEmailUnbind'), value: 'email_unbind' },
    { label: $t('system.notify.mail.businessEmailUnbindNotice'), value: 'email_unbind_notice' },
  ];

  /** 业务场景文案(详情展示用, 未知类型透传原码) */
  function businessTypeText(type: null | string | undefined) {
    if (!type) {
      return '-';
    }
    const found = businessTypeOptions.find((item) => item.value === type);
    return found ? found.label : type;
  }

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

  // 详情抽屉状态
  const detailDrawer = reactive({
    visible: false,
    record: {} as MailRecord,
  });

  // 正文视图: 渲染效果(默认)/HTML 原文
  const contentView = ref<'render' | 'source'>('render');

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
      .then((res) => {
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
    detailDrawer.record = data || {};
    // 每次打开回到默认的渲染视图
    contentView.value = 'render';
    detailDrawer.visible = true;
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
          disabled: row.status !== 'fail' || !hasPermission(PermCodes.System.MailRecord.RESEND),
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
          <vxe-column
            field="businessType"
            :title="$t('system.notify.mail.businessType')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.businessType === 'test'" color="blue">
                {{ $t('system.notify.mail.businessTest') }}
              </a-tag>
              <!-- 验证码类邮件(找回密码/邮箱绑定/邮箱解绑)绿色, 通知类邮件青色 -->
              <a-tag v-else-if="row.businessType === 'password_reset'" color="green">
                {{ $t('system.notify.mail.businessPasswordReset') }}
              </a-tag>
              <a-tag v-else-if="row.businessType === 'email_bind'" color="green">
                {{ $t('system.notify.mail.businessEmailBind') }}
              </a-tag>
              <a-tag v-else-if="row.businessType === 'email_unbind'" color="green">
                {{ $t('system.notify.mail.businessEmailUnbind') }}
              </a-tag>
              <a-tag v-else-if="row.businessType === 'email_change_notice'" color="cyan">
                {{ $t('system.notify.mail.businessEmailChangeNotice') }}
              </a-tag>
              <a-tag v-else-if="row.businessType === 'password_reset_notice'" color="cyan">
                {{ $t('system.notify.mail.businessPasswordResetNotice') }}
              </a-tag>
              <a-tag v-else-if="row.businessType === 'email_unbind_notice'" color="cyan">
                {{ $t('system.notify.mail.businessEmailUnbindNotice') }}
              </a-tag>
              <a-tag v-else>
                {{ businessTypeText(row.businessType) }}
              </a-tag>
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

    <!-- 详情抽屉(弹窗高度受限放不下描述列表+正文预览, 改侧滑抽屉全高滚动) -->
    <a-drawer v-model:open="detailDrawer.visible" :title="$t('system.notify.mail.detailTitle')" :width="800">
      <!-- 描述列表: 间距类加 wrapper 避免被组件 cssinjs 样式覆盖 -->
      <div class="mb-4">
        <a-descriptions :column="1" bordered size="small">
          <!-- 收件邮箱 -->
          <a-descriptions-item :label="$t('system.notify.mail.receiverEmail')">
            {{ detailDrawer.record.receiverEmail }}
          </a-descriptions-item>
          <!-- 主题 -->
          <a-descriptions-item :label="$t('system.notify.mail.subjectField')">
            {{ detailDrawer.record.subject }}
          </a-descriptions-item>
          <!-- 业务场景 -->
          <a-descriptions-item :label="$t('system.notify.mail.businessType')">
            {{ businessTypeText(detailDrawer.record.businessType) }}
          </a-descriptions-item>
          <!-- 发送状态 -->
          <a-descriptions-item :label="$t('system.notify.mail.status')">
            {{
              detailDrawer.record.status === 'success'
                ? $t('system.notify.mail.statusSuccess')
                : detailDrawer.record.status === 'fail'
                  ? $t('system.notify.mail.statusFail')
                  : $t('system.notify.mail.statusSending')
            }}
          </a-descriptions-item>
          <!-- 失败原因 -->
          <a-descriptions-item v-if="detailDrawer.record.status === 'fail'" :label="$t('system.notify.mail.errorMsg')">
            {{ detailDrawer.record.errorMsg || '-' }}
          </a-descriptions-item>
          <!-- 重试次数 -->
          <a-descriptions-item :label="$t('system.notify.mail.retryCount')">
            {{ detailDrawer.record.retryCount ?? 0 }}
          </a-descriptions-item>
          <!-- 发送时间 -->
          <a-descriptions-item :label="$t('system.notify.mail.sendTime')">
            {{ formatDateTime(detailDrawer.record.sendTime) || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
      <!-- 邮件正文: 默认渲染效果(iframe 沙箱隔离, content 为完整 HTML 文档, v-html 会丢 body 级样式), 可切 HTML 原文排查样式问题 -->
      <div class="detail-content">
        <div class="detail-content__header">
          <div class="detail-content__title">{{ $t('system.notify.mail.contentField') }}</div>
          <!-- 正文视图切换: 渲染效果/HTML 原文 -->
          <a-radio-group v-model:value="contentView" button-style="solid" size="small">
            <!-- 渲染效果 -->
            <a-radio-button value="render">{{ $t('system.notify.mail.contentViewRender') }}</a-radio-button>
            <!-- HTML 原文 -->
            <a-radio-button value="source">{{ $t('system.notify.mail.contentViewSource') }}</a-radio-button>
          </a-radio-group>
        </div>
        <template v-if="detailDrawer.record.content">
          <iframe
            v-if="contentView === 'render'"
            :srcdoc="detailDrawer.record.content"
            sandbox=""
            class="detail-content__frame"
          />
          <pre v-else class="detail-content__source">{{ detailDrawer.record.content }}</pre>
        </template>
        <div v-else class="detail-content__empty">-</div>
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
  .detail-content__header {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .detail-content__title {
    font-size: 14px;
    font-weight: 500;
  }

  /* 渲染效果视图: iframe 沙箱渲染完整 HTML 文档 */
  .detail-content__frame {
    width: 100%;
    min-height: 520px;
    background: #f4f6f8;
    border: 1px solid hsl(var(--border));
    border-radius: 8px;
  }

  /* HTML 原文视图: 等宽排版 + 自动换行 */
  .detail-content__source {
    max-height: 520px;
    padding: 12px;
    overflow: auto;
    font-size: 12px;
    word-break: break-all;
    white-space: pre-wrap;
    background: hsl(var(--muted) / 40%);
    border-radius: 8px;
  }

  .detail-content__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    font-size: 12px;
    color: hsl(var(--muted-foreground));
    background: hsl(var(--muted) / 40%);
    border-radius: 8px;
  }
</style>
