<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import {
    ChannelTerminalApi,
    type ChannelTerminalResult,
    type TerminalDeviceResult,
  } from '#/api/payment/device/terminal.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import ChannelTerminalBindDrawer from './ChannelTerminalBindDrawer.vue';
  import ChannelTerminalEdit from './ChannelTerminalEdit.vue';

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
  const bindRef = ref<InstanceType<typeof ChannelTerminalBindDrawer>>();

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
      .then((res: any) => {
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

  function handleBind(row: ChannelTerminalResult) {
    bindRef.value?.show(row);
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
    :width="960"
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
      <!-- 已绑定的系统终端(创建即绑定) -->
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
              v-if="hasPermission(PermCodes.Channel.Merchant.VIEW)"
              type="link"
              size="small"
              @click="handleBind(row)"
            >
              {{ $t('payment.device.terminal.bindManage') }}
            </a-button>
            <a-button
              v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)"
              type="link"
              size="small"
              danger
              @click="handleDelete(row)"
            >
              {{ $t('common.delete') }}
            </a-button>
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
    <ChannelTerminalBindDrawer ref="bindRef" />
  </a-drawer>
</template>
