<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import {
    ChannelTerminalApi,
    type ChannelTerminalResult,
    type TerminalDeviceResult,
  } from '#/api/payment/device/terminal.api';
  // 通道终端状态 → 标签颜色(与 plus / 运营端共用同一份常量)
  import { channelTerminalStatusColorMap as statusColorMap } from '#/enums/payment';

  /**
   * 终端台账抽屉(商户端, 只读)
   *
   * 只展示本商户在某通道商户下的通道侧终端与绑定关系, 不提供登记/报备/绑定等写操作
   * (这些动作收口运营端); 商户号由后端从登录上下文强制写入。
   */
  defineOptions({ name: 'ChannelTerminalPanel' });

  const visible = ref(false);
  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 当前通道商户号(由宿主工作台传入)
  const channelMchNo = ref('');

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<ChannelTerminalResult[]>([]);

  const drawerTitle = computed(() => {
    // 终端台账 - 通道商户号
    return `${$t('payment.merchant.channelMerchant.cardTerminal')} - ${channelMchNo.value}`;
  });

  /**
   * 打开面板
   */
  function open(no: string) {
    channelMchNo.value = no;
    visible.value = true;
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /**
   * 分页查询(固定当前通道商户; 商户号后端取登录上下文)
   */
  function queryPage() {
    if (!channelMchNo.value) {
      return;
    }
    loading.value = true;
    ChannelTerminalApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      channelMchNo: channelMchNo.value,
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
   * 绑定的商户终端文案
   */
  function systemTerminalLabel(terminals?: TerminalDeviceResult[]) {
    if (!terminals || terminals.length === 0) {
      return '-';
    }
    return terminals.map((i) => `${i.name || '-'} (${i.terminalNo})`).join('；');
  }

  watch(visible, (openFlag) => {
    if (openFlag) {
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
    <div class="mb-4">
      <!-- 只读提示: 通道终端的登记/报备/绑定由平台运营维护 -->
      <a-alert type="info" show-icon :message="$t('payment.device.terminal.ledgerReadOnlyTip')" />
    </div>
    <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
    <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
      <vxe-column field="name" :title="$t('payment.device.terminal.field.name')" :min-width="120" />
      <!-- 已绑定的商户终端(运营端报备通道终端时建立关联) -->
      <vxe-column :title="$t('payment.device.terminal.field.boundMerchantTerminal')" :min-width="160">
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
          <a-tag :color="statusColorMap[row.status] || 'default'">{{ statusLabel(row.status) }}</a-tag>
        </template>
      </vxe-column>
      <vxe-column field="remark" :title="$t('payment.device.terminal.field.remark')" :min-width="140" show-overflow />
      <vxe-column
        field="createTime"
        :title="$t('payment.device.terminal.field.createTime')"
        :min-width="180"
        formatter="formatDateTime"
      />
    </vxe-table>
    <div class="mt-3 flex justify-end">
      <vxe-pager
        v-model:current-page="pageConfig.currentPage"
        v-model:page-size="pageConfig.pageSize"
        :total="pageConfig.total"
        @page-change="handlePageChange"
      />
    </div>
  </a-drawer>
</template>
