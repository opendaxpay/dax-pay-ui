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
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import ChannelTerminalEdit from './ChannelTerminalEdit.vue';
  import ChannelTerminalRegisterModal from './ChannelTerminalRegisterModal.vue';

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
    editRef.value?.showAdd({ mchNo: props.mchNo, channelMchNo: props.channelMchNo });
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

  /** 是否已绑定系统终端 */
  function hasBound(row: ChannelTerminalResult): boolean {
    return (row.systemTerminals?.length ?? 0) > 0;
  }

  /**
   * 解绑系统终端(解除该通道终端与全部已绑定系统终端的关联)
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
   * 更多操作菜单(删除/解绑)
   *
   * a-dropdown 的 menu prop 要求 MenuProps 对象(items+onClick), 传裸数组会因 menu.items
   * 为空导致弹出层渲染为空(点击无反应)——全站统一走 items+onClick 形态
   */
  function getActionMenu(row: ChannelTerminalResult): MenuProps {
    const items: any[] = [
      {
        key: 'unbind',
        // 解绑系统终端
        label: $t('payment.device.terminal.unbind'),
        disabled: !hasBound(row) || !hasPermission(PermCodes.Channel.Merchant.MANAGE),
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
        if (key === 'unbind') {
          handleUnbind(row);
          return;
        }
        if (key === 'delete') {
          handleDelete(row);
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
   * 已绑定系统终端文案
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
    :body-style="{ paddingBottom: '24px' }"
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
      <!-- 已绑定的系统终端(建档即绑定) -->
      <vxe-column :title="$t('payment.device.terminal.field.systemTerminal')" :min-width="160">
        <template #default="{ row }">
          {{ systemTerminalLabel(row.systemTerminals) }}
        </template>
      </vxe-column>
      <vxe-column field="type" :title="$t('payment.device.terminal.field.type')" :min-width="120">
        <template #default="{ row }">
          {{ typeLabel(row.type) }}
        </template>
      </vxe-column>
      <vxe-column field="outTerminalNo" :title="$t('payment.device.terminal.field.outTerminalNo')" :min-width="140" />
      <vxe-column field="status" :title="$t('payment.device.terminal.field.status')" :min-width="100" align="center">
        <template #default="{ row }">
          <a-tag>{{ statusLabel(row.status) }}</a-tag>
        </template>
      </vxe-column>
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
            <a-button
              v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)"
              type="link"
              size="small"
              @click="handleRegister(row)"
            >
              {{ $t('payment.device.terminal.register') }}
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

    <ChannelTerminalEdit ref="editRef" @ok="queryPage" />
    <ChannelTerminalRegisterModal ref="registerRef" @ok="queryPage" />
  </a-drawer>
</template>
