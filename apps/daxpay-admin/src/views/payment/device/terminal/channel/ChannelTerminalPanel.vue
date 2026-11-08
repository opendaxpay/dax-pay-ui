<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    ChannelTerminalApi,
    type ChannelTerminalResult,
    type TerminalDeviceResult,
  } from '#/api/payment/device/terminal.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { channelTerminalStatusColorMap } from '#/enums/payment/channelEnum';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import ChannelTerminalEdit from './ChannelTerminalEdit.vue';
  import ChannelTerminalRegisterModal from './ChannelTerminalRegisterModal.vue';
  import ChannelTerminalReportDrawer from './ChannelTerminalReportDrawer.vue';

  defineOptions({ name: 'ChannelTerminalPanel' });

  const props = defineProps<{
    /** 通道商户号 */
    channelMchNo: string;
    /** 系统商户号 */
    mchNo: string;
  }>();

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const visible = ref(false);
  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const editRef = ref<InstanceType<typeof ChannelTerminalEdit>>();
  const registerRef = ref<InstanceType<typeof ChannelTerminalRegisterModal>>();
  const reportRef = ref<InstanceType<typeof ChannelTerminalReportDrawer>>();

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<ChannelTerminalResult[]>([]);

  const drawerTitle = computed(() => {
    // 终端台账 - 通道商户号
    return `${$t('payment.merchant.channelMerchant.cardTerminal')} - ${props.channelMchNo || ''}`;
  });

  /**
   * 打开面板
   */
  function open() {
    visible.value = true;
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /**
   * 分页查询(固定当前通道商户)
   */
  function queryPage() {
    if (!props.channelMchNo) {
      return;
    }
    loading.value = true;
    ChannelTerminalApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      mchNo: props.mchNo,
      channelMchNo: props.channelMchNo,
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

  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  function handleAdd() {
    // 产品取当前台账首条(同通道商户产品一致); 空台账时由编辑弹窗回退 JSON 文本域
    editRef.value?.showAdd({
      mchNo: props.mchNo,
      channelMchNo: props.channelMchNo,
      product: tableData.value[0]?.product || '',
    });
  }

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
   * 终端报备(报备即绑定: 选择商户终端; 人工通道由抽屉提示走手动调整)
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
      // 确定注销该通道终端吗？注销后该终端号不可用于收款
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

  /** 是否已绑定商户终端 */
  function hasBound(row: ChannelTerminalResult): boolean {
    return (row.systemTerminals?.length ?? 0) > 0;
  }

  /**
   * 解绑商户终端(解除该通道终端与全部已绑定商户终端的关联)
   */
  function handleUnbind(row: ChannelTerminalResult) {
    const terminals = row.systemTerminals || [];
    if (terminals.length === 0 || !row.id) {
      return;
    }
    confirm({
      // 确定解除绑定吗？
      content: $t('payment.device.terminal.confirmUnbind'),
      onOk() {
        return Promise.all(
          terminals.map((term) =>
            ChannelTerminalApi.unbind({
              systemTerminalNo: term.terminalNo!,
              channelTerminalId: row.id!,
            }),
          ),
        ).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 更多操作菜单(同步/手动调整/解绑/删除)
   *
   * a-dropdown 的 menu prop 要求 MenuProps 对象(items+onClick), 传裸数组会因 menu.items
   * 为空导致弹出层渲染为空(点击无反应)——全站统一走 items+onClick 形态
   */
  function getActionMenu(row: ChannelTerminalResult): MenuProps {
    // 关联关系在通道侧维护: 未报送时允许解绑, 已报送须先注销
    const canUnbind = hasBound(row) && row.status !== 'submit';
    const items: any[] = [
      {
        key: 'sync',
        // 同步状态
        label: $t('payment.device.terminal.sync'),
        disabled: !hasBound(row) || !hasPermission(PermCodes.Channel.Merchant.MANAGE),
      },
      {
        key: 'register',
        // 手动调整(通道侧已报备完成时, 手工订正通道终端号与登记状态)
        label: $t('payment.device.terminal.register'),
        disabled: !hasPermission(PermCodes.Channel.Merchant.MANAGE),
      },
      {
        key: 'unbind',
        // 解绑商户终端
        label: $t('payment.device.terminal.unbind'),
        disabled: !canUnbind || !hasPermission(PermCodes.Channel.Merchant.MANAGE),
      },
      { type: 'divider' },
      {
        key: 'delete',
        // 删除
        label: $t('common.delete'),
        danger: true,
        disabled: !hasPermission(PermCodes.Channel.Merchant.MANAGE),
      },
    ];
    return {
      items,
      onClick: ({ key }: any) => {
        switch (key) {
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
          case 'unbind': {
            handleUnbind(row);
            break;
          }
        }
      },
    };
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
   * 类型文案
   */
  function typeLabel(type?: string) {
    if (!type) {
      return '-';
    }
    return $t(`dict.terminal_type.${type}`);
  }

  /**
   * 已绑定商户终端文案
   */
  function systemTerminalLabel(terminals?: TerminalDeviceResult[]) {
    if (!terminals || terminals.length === 0) {
      return '-';
    }
    return terminals.map((i) => `${i.name || '-'} (${i.terminalNo})`).join('；');
  }

  watch(visible, (open) => {
    if (open) {
      // 抽屉打开后连接 toolbar
      setTimeout(() => {
        xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
      }, 0);
    }
  });

  defineExpose({ open });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="drawerTitle"
    :default-size="960"
    :destroy-on-hidden="true"
  >
    <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
      <template #buttons>
        <a-button v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)" type="primary" @click="handleAdd">
          {{ $t('payment.device.terminal.add') }}
        </a-button>
      </template>
    </vxe-toolbar>
    <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
      <vxe-column field="name" :title="$t('payment.device.terminal.field.name')" :min-width="120" />
      <vxe-column field="type" :title="$t('payment.device.terminal.field.type')" :min-width="120">
        <template #default="{ row }">
          {{ typeLabel(row.type) }}
        </template>
      </vxe-column>
      <!-- 已绑定的商户终端(建档即绑定) -->
      <vxe-column :title="$t('payment.device.terminal.field.boundMerchantTerminal')" :min-width="160">
        <template #default="{ row }">
          {{ systemTerminalLabel(row.systemTerminals) }}
        </template>
      </vxe-column>
      <vxe-column field="status" :title="$t('payment.device.terminal.field.status')" :min-width="100" align="center">
        <template #default="{ row }">
          <a-tag :color="channelTerminalStatusColorMap[row.status] || 'default'">
            {{ statusLabel(row.status) }}
          </a-tag>
        </template>
      </vxe-column>
      <vxe-column field="outTerminalNo" :title="$t('payment.device.terminal.field.outTerminalNo')" :min-width="140" />
      <vxe-column field="errorMsg" :title="$t('payment.device.terminal.field.errorMsg')" :min-width="120" />
      <vxe-column fixed="right" width="220" :show-overflow="false" :title="$t('common.operation')">
        <template #default="{ row }">
          <a-space :size="2">
            <template #separator>
              <a-divider type="vertical" />
            </template>
            <a-button
              v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)"
              type="link"
              size="small"
              @click="handleEdit(row)"
            >
              {{ $t('common.edit') }}
            </a-button>
            <template v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)">
              <!-- 已报送: 报备不可重复, 按钮变注销(二次确认) -->
              <a-button
                v-if="row.status === 'submit'"
                type="link"
                size="small"
                danger
                @click="handleCancelTerminal(row)"
              >
                {{ $t('payment.device.terminal.cancel') }}
              </a-button>
              <a-button v-else type="link" size="small" @click="handleReport(row)">
                {{ $t('payment.device.terminal.report') }}
              </a-button>
            </template>
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

    <ChannelTerminalEdit ref="editRef" @ok="queryPage" />
    <ChannelTerminalRegisterModal ref="registerRef" @ok="queryPage" />
    <ChannelTerminalReportDrawer ref="reportRef" @ok="queryPage" />
  </a-drawer>
</template>
