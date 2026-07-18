<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { DeviceQrCodeApi, type DeviceQrCodeResult } from '#/api/payment/device/qrcode.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { QrCode } from '#/components/qrcode';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import DeviceQrCodeBatchCreate from './DeviceQrCodeBatchCreate.vue';
  import DeviceQrCodeBindMerchant from './DeviceQrCodeBindMerchant.vue';
  import DeviceQrCodeEdit from './DeviceQrCodeEdit.vue';

  defineOptions({ name: 'DeviceQrCode' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const editRef = ref<InstanceType<typeof DeviceQrCodeEdit>>();
  const batchCreateRef = ref<InstanceType<typeof DeviceQrCodeBatchCreate>>();
  const bindMerchantRef = ref<InstanceType<typeof DeviceQrCodeBindMerchant>>();

  const queryForm = ref<Record<string, any>>({});
  // 勾选行
  const selectedRows = ref<DeviceQrCodeResult[]>([]);

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'mchNo',
      name: $t('payment.device.qrcode.field.mchNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'storeNo',
      // 门店号
      name: $t('payment.device.qrcode.field.storeNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'batchNo',
      name: $t('payment.device.qrcode.field.batchNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'code',
      name: $t('payment.device.qrcode.field.code'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'name',
      name: $t('payment.device.qrcode.field.name'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'programType',
      name: $t('payment.device.qrcode.field.programType'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.device.qrcode.programType.h5'), value: 'h5' },
        { label: $t('payment.device.qrcode.programType.mini_app'), value: 'mini_app' },
      ],
    },
    {
      type: 'list',
      field: 'amountType',
      name: $t('payment.device.qrcode.field.amountType'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.device.qrcode.amountType.random'), value: 'random' },
        { label: $t('payment.device.qrcode.amountType.fixed'), value: 'fixed' },
      ],
    },
    {
      type: 'list',
      field: 'status',
      name: $t('payment.device.qrcode.field.status'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.device.qrcode.status.enabled'), value: 'enabled' },
        { label: $t('payment.device.qrcode.status.disabled'), value: 'disabled' },
      ],
    },
  ]);

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<DeviceQrCodeResult[]>([]);

  // 查看码牌弹窗
  const codeVisible = ref(false);
  const qrCodeUrl = ref('');

  /**
   * 同步勾选行
   */
  function handleCheckboxChange() {
    selectedRows.value = (xTable.value?.getCheckboxRecords() || []) as DeviceQrCodeResult[];
  }

  /**
   * 分页查询码牌列表
   */
  function queryPage() {
    loading.value = true;
    DeviceQrCodeApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res: any) => {
        tableData.value = res.data.records || [];
        pageConfig.value.total = Number(res.data.total) || 0;
        // 同步清空表格勾选与业务选中态, 避免按钮/复选框状态不一致
        xTable.value?.clearCheckboxRow();
        selectedRows.value = [];
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

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  function handleBatchCreate() {
    batchCreateRef.value?.show();
  }

  function handleEdit(row: DeviceQrCodeResult) {
    editRef.value?.showEdit(row);
  }

  /**
   * 获取勾选 id, 无勾选时提示
   */
  function getSelectedIds(): null | string[] {
    const ids = selectedRows.value.map((row) => row.id!).filter(Boolean);
    if (ids.length === 0) {
      message.warning($t('payment.device.qrcode.selectRequired'));
      return null;
    }
    return ids;
  }

  /**
   * 批量绑定商户
   */
  function handleBindMerchant() {
    const ids = getSelectedIds();
    if (!ids) {
      return;
    }
    bindMerchantRef.value?.show(ids);
  }

  /**
   * 批量解绑商户
   */
  function handleUnbindMerchant() {
    const ids = getSelectedIds();
    if (!ids) {
      return;
    }
    confirm({
      content: $t('payment.device.qrcode.confirmUnbind'),
      onOk() {
        return DeviceQrCodeApi.unbindMerchant(ids).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 工具栏批量操作菜单(仅绑定/解绑商户; 应用/门店在绑商户弹窗可选)
   */
  function getBatchActionMenu(): MenuProps {
    return {
      items: [
        { key: 'bindMerchant', label: $t('payment.device.qrcode.bindMerchant') },
        {
          key: 'unbindMerchant',
          label: $t('payment.device.qrcode.unbindMerchant'),
          danger: true,
        },
      ],
      onClick: ({ key }: { key: string }) => {
        if (key === 'bindMerchant') {
          handleBindMerchant();
        } else if (key === 'unbindMerchant') {
          handleUnbindMerchant();
        }
      },
    };
  }

  /**
   * 删除码牌
   */
  function handleDelete(row: DeviceQrCodeResult) {
    confirm({
      content: $t('payment.device.qrcode.confirmDelete'),
      onOk() {
        return DeviceQrCodeApi.delete(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 修改状态(启用/停用)
   */
  function handleChangeStatus(row: DeviceQrCodeResult, target: 'disabled' | 'enabled') {
    confirm({
      content:
        target === 'enabled' ? $t('payment.device.qrcode.confirmEnable') : $t('payment.device.qrcode.confirmDisable'),
      onOk() {
        return DeviceQrCodeApi.changeStatus(row.id!, target).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 查看码牌二维码(拉取完整扫码链接后弹窗展示)
   */
  function handleViewCode(row: DeviceQrCodeResult) {
    if (!row.code) {
      return;
    }
    DeviceQrCodeApi.getCodeLink(row.code).then((res) => {
      qrCodeUrl.value = res.data || '';
      codeVisible.value = true;
    });
  }

  /**
   * 复制码牌扫码链接
   */
  async function handleCopyCode() {
    if (!qrCodeUrl.value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(qrCodeUrl.value);
      message.success($t('common.operationSuccess'));
    } catch {
      message.error($t('common.operationFailed'));
    }
  }

  // import 放最后避免循环依赖(参照项目惯例)
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <a-button
                v-if="hasPermission(PermCodes.Device.QrCode.MANAGE)"
                type="primary"
                @click="handleBatchCreate"
                >{{ $t('payment.device.qrcode.batchCreate') }}</a-button
              >
              <!-- 批量操作: 仅绑/解商户(应用/门店在绑商户弹窗可选) -->
              <a-dropdown
                v-if="hasPermission(PermCodes.Device.QrCode.MANAGE)"
                :disabled="selectedRows.length === 0"
                :menu="getBatchActionMenu()"
              >
                <a-button :disabled="selectedRows.length === 0">
                  {{ $t('payment.device.qrcode.batchActions') }}
                  <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                </a-button>
              </a-dropdown>
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table
          ref="xTable"
          :row-config="{ keyField: 'id' }"
          :data="tableData"
          :loading="loading"
          @checkbox-change="handleCheckboxChange"
          @checkbox-all="handleCheckboxChange"
        >
          <vxe-column type="checkbox" width="50" />
          <!-- 编码可点, 打开查看码牌弹窗(替代操作列单独按钮) -->
          <vxe-column field="code" :title="$t('payment.device.qrcode.field.code')" :min-width="200">
            <template #default="{ row }">
              <a
                v-if="hasPermission(PermCodes.Device.QrCode.VIEW) && row.code"
                class="vben-link"
                @click="handleViewCode(row)"
                >{{ row.code }}</a
              >
              <span v-else>{{ row.code || '-' }}</span>
            </template>
          </vxe-column>
          <vxe-column field="name" :title="$t('payment.device.qrcode.field.name')" :min-width="140" />
          <!-- 码牌类型: h5 → /h, mini_app → /m -->
          <vxe-column
            field="programType"
            :title="$t('payment.device.qrcode.field.programType')"
            :min-width="110"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.programType === 'mini_app'" color="purple">
                {{ $t('payment.device.qrcode.programType.mini_app') }}
              </a-tag>
              <a-tag v-else color="blue">
                {{ $t('payment.device.qrcode.programType.h5') }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="batchNo" :title="$t('payment.device.qrcode.field.batchNo')" :min-width="140">
            <template #default="{ row }">
              <span v-if="row.batchNo">{{ row.batchNo }}</span>
              <span v-else style="color: var(--text-color-placeholder)">-</span>
            </template>
          </vxe-column>
          <!-- 商户: 已绑定名称上+号下小字; 未绑定 tag -->
          <vxe-column field="mchName" :title="$t('payment.device.qrcode.field.merchant')" :min-width="160">
            <template #default="{ row }">
              <div v-if="row.mchNo" class="flex flex-col">
                <span>{{ row.mchName || '-' }}</span>
                <span class="text-xs text-muted-foreground">{{ row.mchNo }}</span>
              </div>
              <a-tag v-else color="default">{{ $t('payment.device.qrcode.unbound') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 应用: 有 appId 显示号; 空=默认应用 -->
          <vxe-column field="appId" :title="$t('payment.device.qrcode.field.appId')" :min-width="140">
            <template #default="{ row }">
              <span v-if="row.appId">{{ row.appId }}</span>
              <span v-else-if="row.mchNo" style="color: var(--text-color-placeholder)">{{
                $t('payment.device.qrcode.defaultApp')
              }}</span>
              <span v-else style="color: var(--text-color-placeholder)">-</span>
            </template>
          </vxe-column>
          <!-- 门店: 名称上+号下小字; 未绑显示「默认门店」提示(支付侧 resolve) -->
          <vxe-column field="storeName" :title="$t('payment.device.qrcode.field.store')" :min-width="160">
            <template #default="{ row }">
              <div v-if="row.storeNo" class="flex flex-col">
                <span>{{ row.storeName || '-' }}</span>
                <span class="text-xs text-muted-foreground">{{ row.storeNo }}</span>
              </div>
              <span v-else-if="row.mchNo" style="color: var(--text-color-placeholder)">{{
                $t('payment.device.qrcode.defaultStoreHint')
              }}</span>
              <span v-else style="color: var(--text-color-placeholder)">-</span>
            </template>
          </vxe-column>
          <!-- 金额类型 + 固定金额合并: 固定显示金额, 自定义显示类型文案 -->
          <vxe-column
            field="amountType"
            :title="$t('payment.device.qrcode.amountLabel')"
            :min-width="120"
            align="center"
          >
            <template #default="{ row }">
              <span v-if="row.amountType === 'fixed' && row.fixedAmount">
                ¥{{ (row.fixedAmount / 100).toFixed(2) }}
              </span>
              <span v-else>{{ $t(`payment.device.qrcode.amountType.${row.amountType || 'random'}`) }}</span>
            </template>
          </vxe-column>
          <vxe-column field="status" :title="$t('payment.device.qrcode.field.status')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.status === 'enabled'" color="green">
                {{ $t('payment.device.qrcode.status.enabled') }}
              </a-tag>
              <a-tag v-else color="default">
                {{ $t('payment.device.qrcode.status.disabled') }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column
            field="createTime"
            :title="$t('payment.device.qrcode.field.createTime')"
            :min-width="180"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" width="180" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.Device.QrCode.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                  >{{ $t('common.edit') }}</a-button
                >
                <a-button
                  v-if="hasPermission(PermCodes.Device.QrCode.MANAGE) && row.status !== 'enabled'"
                  type="link"
                  size="small"
                  @click="handleChangeStatus(row, 'enabled')"
                  >{{ $t('payment.device.qrcode.enable') }}</a-button
                >
                <a-button
                  v-else-if="hasPermission(PermCodes.Device.QrCode.MANAGE) && row.status === 'enabled'"
                  type="link"
                  size="small"
                  @click="handleChangeStatus(row, 'disabled')"
                  >{{ $t('payment.device.qrcode.disable') }}</a-button
                >
                <a-button
                  v-if="hasPermission(PermCodes.Device.QrCode.MANAGE)"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(row)"
                  >{{ $t('common.delete') }}</a-button
                >
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
          @page-change="handlePageChange"
        />
      </a-card>
    </div>

    <DeviceQrCodeEdit ref="editRef" @ok="queryPage" />
    <DeviceQrCodeBatchCreate ref="batchCreateRef" @ok="queryPage" />
    <DeviceQrCodeBindMerchant ref="bindMerchantRef" @ok="queryPage" />

    <!-- 查看码牌弹窗: 素二维码 + 下方扫码地址 -->
    <a-modal
      v-model:open="codeVisible"
      :title="$t('payment.device.qrcode.qrCodeTitle')"
      :width="420"
      :footer="null"
      :destroy-on-hidden="true"
    >
      <div class="code-modal">
        <p class="code-tip">{{ $t('payment.device.qrcode.qrCodeTip') }}</p>
        <div v-if="qrCodeUrl" class="qr-card">
          <QrCode :value="qrCodeUrl" :width="250" :margin="0" />
        </div>
        <div class="code-url">{{ qrCodeUrl }}</div>
        <a-button type="primary" block :disabled="!qrCodeUrl" @click="handleCopyCode">
          {{ $t('payment.device.qrcode.copyLink') }}
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
  .code-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 8px 0 4px;
  }

  .code-tip {
    margin: 0;
    color: var(--text-color-secondary);
    font-size: 13px;
  }

  .qr-card {
    padding: 12px;
    background: #fff;
    border: 1px solid var(--border-color, #e8e8e8);
    border-radius: 8px;
  }

  .code-url {
    width: 100%;
    padding: 0 8px;
    color: var(--text-color-secondary);
    font-size: 12px;
    line-height: 1.5;
    text-align: center;
    word-break: break-all;
  }
</style>
