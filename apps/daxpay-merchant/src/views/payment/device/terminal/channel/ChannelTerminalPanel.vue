<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    ChannelTerminalApi,
    type ChannelTerminalResult,
    type TerminalCapabilityResult,
    type TerminalDeviceResult,
  } from '#/api/payment/device/terminal.api';
  import { PermCodes } from '#/constants/perm-codes';
  // 通道终端状态 → 标签颜色(与 plus / 运营端共用同一份常量)
  import { channelTerminalStatusColorMap as statusColorMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import ChannelTerminalEdit from './ChannelTerminalEdit.vue';
  import ChannelTerminalRegisterModal from './ChannelTerminalRegisterModal.vue';
  import ChannelTerminalReportDrawer from './ChannelTerminalReportDrawer.vue';

  /**
   * 终端台账抽屉(商户端, 可维护)
   *
   * 商户可维护本商户在某通道商户下的通道终端: 新增建档(绑定商户终端)/编辑/报备/同步/
   * 手动调整/解绑/注销/删除; 商户号由后端从登录上下文强制写入并做归属校验。
   */
  defineOptions({ name: 'ChannelTerminalPanel' });

  const props = defineProps<{
    /** 通道商户号 */
    channelMchNo: string;
    /** 支付产品(用于查询通道报送能力与报备字段定义) */
    product?: string;
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

  // 通道终端维护能力(报备/同步/注销是否可用); 未取到时默认放开, 由后端兜底拒绝
  const capabilities = ref<TerminalCapabilityResult>({
    reportSupported: true,
    supportsCancel: true,
    supportsSync: true,
  });

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<ChannelTerminalResult[]>([]);

  // 是否支持自动报备(不支持时按钮禁用并提示联系平台运营)
  const reportSupported = computed(() => capabilities.value.reportSupported !== false);
  // 是否支持状态同步
  const supportsSync = computed(() => capabilities.value.supportsSync !== false);
  // 是否支持注销
  const supportsCancel = computed(() => capabilities.value.supportsCancel !== false);

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
    loadCapabilities();
  }

  /**
   * 加载通道终端维护能力(报备/同步/注销)
   */
  function loadCapabilities() {
    if (!props.product) {
      return;
    }
    ChannelTerminalApi.capabilities(props.product)
      .then(({ data }) => {
        if (data) {
          capabilities.value = {
            reportSupported: data.reportSupported !== false,
            supportsCancel: data.supportsCancel !== false,
            supportsSync: data.supportsSync !== false,
            terminalTypes: data.terminalTypes || [],
            extraFields: data.extraFields || [],
          };
        }
      })
      .catch(() => {
        // 能力查询失败不阻断台账维护, 保持默认放开
      });
  }

  /**
   * 分页查询(固定当前通道商户; 商户号后端取登录上下文)
   */
  function queryPage() {
    if (!props.channelMchNo) {
      return;
    }
    loading.value = true;
    ChannelTerminalApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
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
    editRef.value?.showAdd({
      channelMchNo: props.channelMchNo,
      // 产品优先取卡片透传; 空台账时回退首条台账的产品
      product: props.product || tableData.value[0]?.product || '',
    });
  }

  function handleEdit(row: ChannelTerminalResult) {
    editRef.value?.showEdit(row);
  }

  /**
   * 手动调整(手工订正通道终端号与登记状态, 不调通道)
   */
  function handleRegister(row: ChannelTerminalResult) {
    confirm({
      // 手动调整仅用于通道控制台已操作后的人工对齐, 确定继续吗？
      content: $t('payment.device.terminal.confirmRegister'),
      onOk() {
        registerRef.value?.show(row);
      },
    });
  }

  /**
   * 终端报备(报备即绑定: 选择商户终端; 人工通道由抽屉提示联系平台运营)
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
   * 删除通道终端台账(通道侧设备如需停用须先注销)
   */
  function handleDelete(row: ChannelTerminalResult) {
    confirm({
      // 删除后本地不再保留该终端台账, 通道侧设备如需停用请先注销
      content: $t('payment.device.terminal.confirmDeleteLedger'),
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
   * 解绑商户终端(解除该通道终端与当前绑定商户终端的关联)
   */
  function handleUnbind(row: ChannelTerminalResult) {
    if (!row.id) {
      return;
    }
    confirm({
      // 确定解除绑定吗？
      content: $t('payment.device.terminal.confirmUnbind'),
      onOk() {
        return ChannelTerminalApi.unbind(row.id!).then(() => {
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
        // 同步状态(通道不支持/未绑定商户终端时禁用)
        label: $t('payment.device.terminal.sync'),
        disabled: !hasBound(row) || !supportsSync.value || !hasPermission(PermCodes.Channel.Merchant.MANAGE),
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
        // 删除(本地台账, 通道侧设备如需停用须先注销)
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
      <!-- 已绑定的商户终端(新增建档时建立关联) -->
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
      <vxe-column
        field="errorMsg"
        :title="$t('payment.device.terminal.field.errorMsg')"
        :min-width="140"
        show-overflow
      />
      <vxe-column field="remark" :title="$t('payment.device.terminal.field.remark')" :min-width="140" show-overflow />
      <vxe-column
        field="createTime"
        :title="$t('payment.device.terminal.field.createTime')"
        :min-width="180"
        formatter="formatDateTime"
      />
      <vxe-column fixed="right" :width="220" :show-overflow="false" :title="$t('common.operation')">
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
                :disabled="!supportsCancel"
                @click="handleCancelTerminal(row)"
              >
                {{ $t('payment.device.terminal.cancel') }}
              </a-button>
              <a-tooltip v-else-if="!reportSupported" :title="$t('payment.device.terminal.reportNotSupported')">
                <span>
                  <a-button type="link" size="small" disabled>
                    {{ $t('payment.device.terminal.report') }}
                  </a-button>
                </span>
              </a-tooltip>
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
      <template #empty>
        <!-- 空态: 有维护权限时引导新增建档并报备 -->
        <span v-if="hasPermission(PermCodes.Channel.Merchant.MANAGE)">
          {{ $t('payment.device.terminal.emptyTip') }}
        </span>
      </template>
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
