<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type { LabelValue } from '#/types/web';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { NameNoCell } from '@daxpay/ui-biz/components/name-no-cell';

  import {
    ChannelTerminalApi,
    type ChannelTerminalResult,
    type TerminalDeviceResult,
  } from '#/api/payment/device/terminal.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { channelI18nMap, channelNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import ChannelTerminalEdit from './ChannelTerminalEdit.vue';
  import ChannelTerminalRegisterModal from './ChannelTerminalRegisterModal.vue';
  import ChannelTerminalReportDrawer from './ChannelTerminalReportDrawer.vue';

  defineOptions({ name: 'ChannelTerminalList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const editRef = ref<InstanceType<typeof ChannelTerminalEdit>>();
  const registerRef = ref<InstanceType<typeof ChannelTerminalRegisterModal>>();
  const reportRef = ref<InstanceType<typeof ChannelTerminalReportDrawer>>();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 商户下拉(筛选条件)
  const merchantOptions = ref<LabelValue[]>([]);

  /**
   * 加载商户下拉
   */
  function loadMerchantOptions() {
    MerchantApi.dropdown(false, true).then(({ data }) => {
      merchantOptions.value = data || [];
    });
  }

  // 登记状态(前端 dict.json, 与后端字典 channel_terminal_status 对齐)
  const statusOptions = computed(() => [
    { label: $t('dict.channel_terminal_status.init'), value: 'init' },
    { label: $t('dict.channel_terminal_status.wait'), value: 'wait' },
    { label: $t('dict.channel_terminal_status.submit'), value: 'submit' },
    { label: $t('dict.channel_terminal_status.logged'), value: 'logged' },
    { label: $t('dict.channel_terminal_status.error'), value: 'error' },
  ]);

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'list',
      field: 'mchNo',
      // 商户
      name: $t('payment.device.terminal.field.mchNo'),
      placeholder: $t('common.pleaseSelect'),
      selectList: merchantOptions.value,
    },
    {
      type: 'string',
      field: 'channelMchNo',
      // 通道商户号
      name: $t('payment.device.terminal.field.channelMchNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'name',
      // 终端名称
      name: $t('payment.device.terminal.field.name'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'outTerminalNo',
      // 通道终端号
      name: $t('payment.device.terminal.field.outTerminalNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'status',
      // 登记状态
      name: $t('payment.device.terminal.field.status'),
      placeholder: $t('common.pleaseSelect'),
      selectList: statusOptions.value,
    },
  ]);

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<ChannelTerminalResult[]>([]);

  /**
   * 分页查询
   */
  function queryPage() {
    loading.value = true;
    ChannelTerminalApi.page({
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
  }

  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  /**
   * 通道展示名(缺映射回退原编码)
   */
  function channelLabel(code?: string): string {
    if (!code) {
      return '-';
    }
    const i18nKey = channelI18nMap[code];
    if (i18nKey) {
      const text = $t(i18nKey);
      if (text && text !== i18nKey) {
        return text;
      }
    }
    return channelNameMap[code] ?? code;
  }

  /**
   * 类型文案
   */
  function typeLabel(type?: string) {
    if (!type) {
      return '-';
    }
    return $t(`dict.terminal_type.${type}`);
  }

  /**
   * 状态文案
   */
  function statusLabel(status?: string) {
    if (!status) {
      return '-';
    }
    return $t(`dict.channel_terminal_status.${status}`);
  }

  /**
   * 状态标签颜色
   */
  const statusColorMap: Record<string, string> = {
    error: 'red',
    init: 'default',
    logged: 'default',
    submit: 'green',
    wait: 'orange',
  };

  function handleEdit(row: ChannelTerminalResult) {
    editRef.value?.showEdit(row);
  }

  /**
   * 手动调整(手工订正通道侧终端号与登记状态, 不调通道)
   */
  function handleRegister(row: ChannelTerminalResult) {
    registerRef.value?.show(row);
  }

  /**
   * 是否已绑定系统终端(报备/同步/注销均以绑定关系中的首个终端号作为报备锚点)
   */
  function hasBound(row: ChannelTerminalResult): boolean {
    return (row.systemTerminals?.length ?? 0) > 0;
  }

  /**
   * 已绑定系统终端文案(多台用分号拼成单行, 交给全局省略+悬浮提示, 避免标签换行撑高行高)
   */
  function systemTerminalLabel(terminals?: TerminalDeviceResult[]) {
    if (!terminals || terminals.length === 0) {
      return '-';
    }
    return terminals.map((i) => `${i.name || '-'} (${i.terminalNo})`).join('；');
  }

  /**
   * 终端报备(报备即绑定: 选择系统终端; 人工通道走手动登记)
   */
  function handleReport(row: ChannelTerminalResult) {
    reportRef.value?.show(row);
  }

  /**
   * 终端状态同步(调通道 API 回读实际状态)
   */
  function handleSync(row: ChannelTerminalResult) {
    ChannelTerminalApi.sync(row.id!).then(() => {
      // 同步请求已执行
      message.success($t('payment.device.terminal.syncSuccess'));
      queryPage();
    });
  }

  /**
   * 终端注销(调通道 API; 注销后该终端号不可用于收款)
   */
  function handleCancelTerminal(row: ChannelTerminalResult) {
    confirm({
      // 确定注销该通道终端吗？注销后该终端号将不可用于收款
      content: $t('payment.device.terminal.confirmCancel'),
      onOk() {
        return ChannelTerminalApi.cancel(row.id!).then(() => {
          // 注销请求已执行
          message.success($t('payment.device.terminal.cancelSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 删除通道终端
   */
  function handleDelete(row: ChannelTerminalResult) {
    confirm({
      // 确定删除该终端吗？
      content: $t('payment.device.terminal.confirmDelete'),
      onOk() {
        return ChannelTerminalApi.delete(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 更多操作菜单(登记调整/同步/注销/删除)
   *
   * a-dropdown 的 menu prop 要求 MenuProps 对象(items+onClick), 传裸数组会因 menu.items
   * 为空导致弹出层渲染为空(点击无反应)——全站统一走 items+onClick 形态
   */
  function getActionMenu(row: ChannelTerminalResult): MenuProps {
    return {
      items: [
        {
          key: 'register',
          // 登记调整
          label: $t('payment.device.terminal.register'),
          disabled: !hasPermission(PermCodes.Channel.Merchant.MANAGE),
        },
        {
          key: 'sync',
          // 同步
          label: $t('payment.device.terminal.sync'),
          disabled: !hasBound(row) || !hasPermission(PermCodes.Channel.Merchant.MANAGE),
        },
        {
          key: 'cancel',
          // 注销
          label: $t('payment.device.terminal.cancel'),
          disabled: !hasPermission(PermCodes.Channel.Merchant.MANAGE),
        },
        { type: 'divider' },
        {
          key: 'delete',
          // 删除
          label: $t('common.delete'),
          danger: true,
          disabled: !hasPermission(PermCodes.Channel.Merchant.MANAGE),
        },
      ],
      onClick: ({ key }: any) => {
        switch (key) {
          case 'cancel': {
            handleCancelTerminal(row);
            break;
          }
          case 'delete': {
            handleDelete(row);
            break;
          }
          case 'register': {
            handleRegister(row);
            break;
          }
          case 'sync': {
            handleSync(row);
            break;
          }
        }
      },
    };
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    loadMerchantOptions();
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
          <vxe-column field="name" :title="$t('payment.device.terminal.field.name')" :min-width="140" />
          <!-- 商户: 名称(商户号)单行, 定位终端归属 -->
          <vxe-column field="mchName" :title="$t('payment.device.terminal.field.mchNo')" :min-width="180">
            <template #default="{ row }">
              <NameNoCell :name="row.mchName" :no="row.mchNo" />
            </template>
          </vxe-column>
          <vxe-column field="channel" :title="$t('payment.device.terminal.field.channel')" :min-width="120">
            <template #default="{ row }">
              {{ channelLabel(row.channel) }}
            </template>
          </vxe-column>
          <vxe-column field="channelMchNo" :title="$t('payment.device.terminal.field.channelMchNo')" :min-width="180" />
          <!-- 绑定的系统终端(建档即绑定; 多台绑定拼成单行 + 全局省略, 避免标签换行撑高行高) -->
          <vxe-column :title="$t('payment.device.terminal.field.systemTerminal')" :min-width="200">
            <template #default="{ row }">
              <span v-if="hasBound(row)">{{ systemTerminalLabel(row.systemTerminals) }}</span>
              <span v-else style="color: var(--text-color-placeholder)">
                {{ $t('payment.device.terminal.noBound') }}
              </span>
            </template>
          </vxe-column>
          <vxe-column field="type" :title="$t('payment.device.terminal.field.type')" :min-width="110" align="center">
            <template #default="{ row }">
              {{ typeLabel(row.type) }}
            </template>
          </vxe-column>
          <vxe-column
            field="status"
            :title="$t('payment.device.terminal.field.status')"
            :min-width="110"
            align="center"
          >
            <template #default="{ row }">
              <a-tag :color="statusColorMap[row.status] || 'default'">{{ statusLabel(row.status) }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="outTerminalNo" :title="$t('payment.device.terminal.field.outTerminalNo')" :min-width="170">
            <template #default="{ row }">
              {{ row.outTerminalNo || '-' }}
            </template>
          </vxe-column>
          <vxe-column
            field="errorMsg"
            :title="$t('payment.device.terminal.field.errorMsg')"
            :min-width="160"
            show-overflow
          />
          <vxe-column
            field="createTime"
            :title="$t('payment.device.terminal.field.createTime')"
            :min-width="180"
            formatter="formatDateTime"
          />
          <vxe-column
            v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)"
            fixed="right"
            width="200"
            :show-overflow="false"
            :title="$t('common.operation')"
          >
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleReport(row)">
                  {{ $t('payment.device.terminal.report') }}
                </a-button>
                <a-button type="link" size="small" @click="handleEdit(row)">
                  {{ $t('common.edit') }}
                </a-button>
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
        <div class="mt-3 flex justify-end">
          <vxe-pager
            v-model:current-page="pageConfig.currentPage"
            v-model:page-size="pageConfig.pageSize"
            :total="pageConfig.total"
            @page-change="handlePageChange"
          />
        </div>
      </a-card>
    </div>

    <ChannelTerminalEdit ref="editRef" @ok="queryPage" />
    <ChannelTerminalRegisterModal ref="registerRef" @ok="queryPage" />
    <ChannelTerminalReportDrawer ref="reportRef" @ok="queryPage" />
  </div>
</template>
