<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';

  import type { AllocReceiverResult } from '#/api/payment/global/alloc-receiver/alloc-receiver.api';

  import { computed, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { IconifyIcon } from '@vben-core/icons';

  import { useMessage } from '#/hooks/useMessage';

  import { PRODUCT_CONFIG, STATUS_COLOR } from './alloc-receiver/constants';
  import ReceiverAliasModal from './alloc-receiver/ReceiverAliasModal.vue';
  import ReceiverBindModal from './alloc-receiver/ReceiverBindModal.vue';
  import ReceiverCreateModal from './alloc-receiver/ReceiverCreateModal.vue';
  import ReceiverDetailModal from './alloc-receiver/ReceiverDetailModal.vue';
  import { useReceiverAppOptions } from './alloc-receiver/useReceiverAppOptions';

  defineOptions({ name: 'AllocReceiverDrawer' });

  const { confirm, message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const actionLoading = ref(false);

  const mchNo = ref('');
  const channelMchNo = ref('');
  const product = ref('');

  const records = ref<AllocReceiverResult[]>([]);
  const pagination = reactive({ current: 1, size: 10, total: 0 });

  /** 查看详情弹窗 */
  const viewVisible = ref(false);
  const viewRow = ref<AllocReceiverResult>();

  /** 弹窗子组件实例 */
  const createModalRef = ref<InstanceType<typeof ReceiverCreateModal>>();
  const bindModalRef = ref<InstanceType<typeof ReceiverBindModal>>();
  const aliasModalRef = ref<InstanceType<typeof ReceiverAliasModal>>();

  /** 详情弹窗的应用下拉(支付宝直连应用名解析) */
  const { appOptions, loadAppOptions } = useReceiverAppOptions();

  /** 当前产品配置(未匹配时为 undefined, 不渲染内容) */
  const config = computed(() => PRODUCT_CONFIG[product.value]);

  /** 应用标签(列表回显绑定所用应用) */
  function appLabel(row: AllocReceiverResult): string {
    if (row.channelAppId) {
      return row.channelAppId;
    }
    if (row.spAppId) {
      return row.spAppId;
    }
    if (row.directAppRefId) {
      const app = appOptions.value.find((a) => a.value === row.directAppRefId);
      return app?.label ?? row.directAppRefId;
    }
    return '-';
  }

  /** 表格列(按模式显隐) */
  const columns = computed(() => {
    const cols: { dataIndex: string; ellipsis?: boolean; fixed?: 'right'; title: string; width: number }[] = [
      { title: $t('payment.channel.allocReceiver.typeLabel'), dataIndex: 'receiverType', width: 150 },
      { title: $t('payment.channel.allocReceiver.account'), dataIndex: 'receiverAccount', width: 170, ellipsis: true },
      { title: $t('payment.channel.allocReceiver.name'), dataIndex: 'receiverName', width: 140, ellipsis: true },
      { title: $t('payment.channel.allocReceiver.alias'), dataIndex: 'alias', width: 130, ellipsis: true },
    ];
    if (config.value?.hasRelation) {
      cols.push({ title: $t('payment.channel.allocReceiver.relationLabel'), dataIndex: 'relationType', width: 120 });
    }
    if (config.value && config.value.appMode !== 'none') {
      cols.push({ title: $t('payment.channel.allocReceiver.app'), dataIndex: 'app', width: 150, ellipsis: true });
    }
    cols.push(
      { title: $t('payment.channel.allocReceiver.statusLabel'), dataIndex: 'status', width: 110 },
      { title: $t('payment.channel.allocReceiver.bindTime'), dataIndex: 'bindTime', width: 160 },
      { title: $t('common.operation'), dataIndex: 'action', width: 220, fixed: 'right' },
    );
    return cols;
  });

  /** 关系类型展示(自定义关系显示名称) */
  function relationText(row: AllocReceiverResult): string {
    if (!row.relationType) {
      return '-';
    }
    if (row.relationType === 'custom' && row.customRelation) {
      return row.customRelation;
    }
    return $t(`payment.channel.allocReceiver.relation.${row.relationType}`);
  }

  /** 打开抽屉(由管理页卡片点击调用) */
  function open(no: string, mchChannelNo: string, productCode: string) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    product.value = productCode;
    visible.value = true;
    pagination.current = 1;
    loadRecords();
  }

  /** 分页查询列表 */
  function loadRecords() {
    loading.value = true;
    config.value?.api
      .page({
        channelMchNo: channelMchNo.value,
        current: pagination.current,
        mchNo: mchNo.value,
        size: pagination.size,
      })
      .then(({ data }) => {
        records.value = data?.records ?? [];
        pagination.total = data?.total ?? 0;
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 分页变更(仅 pageSize 变更时重置页码) */
  function handlePageChange(page: number, pageSize: number) {
    pagination.current = pageSize === pagination.size ? page : 1;
    pagination.size = pageSize;
    loadRecords();
  }

  /** 打开新增弹窗 */
  function openCreate() {
    createModalRef.value?.open(mchNo.value, channelMchNo.value, product.value);
  }

  /** 打开查看详情弹窗 */
  function openView(row: AllocReceiverResult) {
    viewRow.value = row;
    // 支付宝直连的应用引用需下拉数据解析显示名称
    if (config.value?.appMode === 'alipay') {
      loadAppOptions('alipay', mchNo.value, channelMchNo.value);
    }
    viewVisible.value = true;
  }

  /** 打开别名弹窗(纯本地字段, 任意绑定状态均可改) */
  function openAliasModal(row: AllocReceiverResult) {
    aliasModalRef.value?.open(row, product.value);
  }

  /** 行更多菜单(改别名对所有状态可用; 删除仅非绑定状态, 危险操作置底红色) */
  function getActionMenu(row: AllocReceiverResult): MenuProps {
    const items: MenuProps['items'] = [{ key: 'alias', label: $t('payment.channel.allocReceiver.aliasEdit') }];
    if (row.status !== 'bound') {
      items.push({ type: 'divider' }, { key: 'delete', label: $t('common.delete'), danger: true });
    }
    return {
      items,
      onClick: ({ key }: { key: string }) => {
        if (key === 'alias') {
          openAliasModal(row);
        }
        if (key === 'delete') {
          handleDelete(row);
        }
      },
    };
  }

  /** 打开重绑弹窗 */
  function openBindModal(row: AllocReceiverResult) {
    bindModalRef.value?.open(row, mchNo.value, channelMchNo.value, product.value);
  }

  /** 解绑(通道侧解绑接收方, 影响后续分账, 二次确认) */
  function handleUnbind(row: AllocReceiverResult) {
    confirm({
      title: $t('payment.channel.allocReceiver.unbindConfirmTitle'),
      content: $t('payment.channel.allocReceiver.unbindConfirmContent', {
        account: row.receiverName || row.receiverAccount,
      }),
      // 解绑影响通道侧分账资金流向, 确认框确定按钮用危险红色
      okType: 'danger',
      okText: $t('payment.channel.allocReceiver.unbind'),
      onOk() {
        actionLoading.value = true;
        return config.value?.api
          .unbind(row.id!)
          .then(() => {
            message.success($t('payment.channel.allocReceiver.unbindSuccess'));
            loadRecords();
          })
          .finally(() => {
            actionLoading.value = false;
          });
      },
    });
  }

  /** 删除(危险操作, 普通二次确认) */
  function handleDelete(row: AllocReceiverResult) {
    confirm({
      title: $t('payment.channel.allocReceiver.deleteConfirmTitle'),
      content: $t('payment.channel.allocReceiver.deleteConfirmContent', {
        account: row.receiverName || row.receiverAccount,
      }),
      // 删除仅清本地接收方档案(不影响通道侧绑定关系), 普通二次确认即可
      okType: 'danger',
      okText: $t('common.delete'),
      onOk() {
        return config.value?.api.delete(row.id!).then(() => {
          message.success($t('payment.channel.allocReceiver.deleteSuccess'));
          loadRecords();
        });
      },
    });
  }

  defineExpose({ open });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.channel.allocReceiver.drawerTitle')"
    :size="1100"
    destroy-on-hidden
  >
    <div v-if="config" class="flex h-full flex-col">
      <!-- 操作区 -->
      <div class="mb-3 flex items-center justify-between">
        <a-alert type="info" show-icon class="flex-1" :message="$t('payment.channel.allocReceiver.tip')" />
        <div class="ml-3">
          <a-button type="primary" @click="openCreate">
            {{ $t('payment.channel.allocReceiver.create') }}
          </a-button>
        </div>
      </div>

      <!-- 列表 -->
      <a-table
        :data-source="records"
        :columns="columns"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.size,
          total: pagination.total,
          showSizeChanger: true,
        }"
        :scroll="{ x: 1080 }"
        size="small"
        row-key="id"
        @change="handlePageChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'receiverType'">
            <span>{{ $t(`payment.channel.allocReceiver.type.${record.receiverType}`) }}</span>
          </template>
          <!-- 账号较长被截断, 悬浮显示完整内容 -->
          <template v-else-if="column.dataIndex === 'receiverAccount'">
            <a-tooltip :title="record.receiverAccount">
              <span>{{ record.receiverAccount || '-' }}</span>
            </a-tooltip>
          </template>
          <!-- 接收方名称(通道侧真值, 商户号类型为商户全称) -->
          <template v-else-if="column.dataIndex === 'receiverName'">
            <a-tooltip :title="record.receiverName">
              <span>{{ record.receiverName || '-' }}</span>
            </a-tooltip>
          </template>
          <!-- 接收方别名(纯本地备注, 不上送通道) -->
          <template v-else-if="column.dataIndex === 'alias'">
            <a-tooltip :title="record.alias">
              <span>{{ record.alias || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'relationType'">
            <span>{{ relationText(record) }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'app'">
            <a-tooltip :title="appLabel(record)">
              <span class="text-xs">{{ appLabel(record) }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <a-tooltip :title="record.errorMsg">
              <a-tag :color="STATUS_COLOR[record.status] ?? 'default'">
                {{ $t(`payment.channel.allocReceiver.status.${record.status}`) }}
              </a-tag>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'bindTime'">
            <span>{{ formatDateTime(record.bindTime) || '-' }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <a-space :size="2">
              <template #separator>
                <a-divider type="vertical" />
              </template>
              <!-- 查看详情(完整账号/应用/失败原因) -->
              <a-button type="link" size="small" @click="openView(record)">
                {{ $t('common.view') }}
              </a-button>
              <!-- 已绑定: 解绑(危险操作, 二次确认) -->
              <a-button
                v-if="record.status === 'bound'"
                type="link"
                size="small"
                danger
                :loading="actionLoading"
                @click="handleUnbind(record)"
              >
                {{ $t('payment.channel.allocReceiver.unbind') }}
              </a-button>
              <!-- 绑定失败/已解绑: 重新绑定(可换应用) -->
              <a-button v-if="record.status !== 'bound'" type="link" size="small" @click="openBindModal(record)">
                {{ $t('payment.channel.allocReceiver.bind') }}
              </a-button>
              <!-- 更多: 改别名(全状态可用) + 删除(仅非绑定状态, 危险操作置底) -->
              <a-dropdown :menu="getActionMenu(record)">
                <a-button type="link" size="small">
                  {{ $t('common.more') }}
                  <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                </a-button>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增弹窗 -->
    <ReceiverCreateModal ref="createModalRef" @success="loadRecords" />

    <!-- 重新绑定弹窗 -->
    <ReceiverBindModal ref="bindModalRef" @success="loadRecords" />

    <!-- 别名弹窗(纯本地备注, 不上送通道) -->
    <ReceiverAliasModal ref="aliasModalRef" @success="loadRecords" />

    <!-- 查看详情弹窗 -->
    <ReceiverDetailModal
      :open="viewVisible"
      :row="viewRow"
      :config="config"
      :app-options="appOptions"
      @close="viewVisible = false"
    />
  </a-drawer>
</template>
