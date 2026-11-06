<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { confirmExport } from '@daxpay/ui-biz/utils/export-download';

  import { DeviceQrCodeApi, type DeviceQrCodeResult } from '#/api/payment/device/qrcode.api';
  import { MchAppInfoApi } from '#/api/payment/merchant/mch-app-info.api';
  import { MchStoreInfoApi } from '#/api/payment/merchant/store.api';
  import { QrCode } from '#/components/qrcode';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import DeviceQrCodeEdit from './DeviceQrCodeEdit.vue';

  defineOptions({ name: 'DeviceQrCodeList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();
  const route = useRoute();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const editRef = ref<InstanceType<typeof DeviceQrCodeEdit>>();

  // 勾选行、导出与批量操作状态
  const selectedRows = ref<DeviceQrCodeResult[]>([]);
  const exporting = ref(false);
  const batchVisible = ref(false);
  const batchSaving = ref(false);
  const batchType = ref<'bindApp' | 'bindStore'>('bindApp');
  const batchValue = ref<string>();

  // 应用/门店下拉选项(商户端由登录态隔离, 无需传 mchNo)
  const appOptions = ref<{ label: string; value: string }[]>([]);
  const storeOptions = ref<{ label: string; value: string }[]>([]);

  /**
   * 加载应用/门店下拉(批量绑定时选择目标归属)
   */
  function loadSelectOptions() {
    MchAppInfoApi.enableList().then(({ data }) => {
      appOptions.value = (data || []).map((item) => ({
        label: item.appName ? `${item.appName} (${item.appId})` : item.appId!,
        value: item.appId!,
      }));
    });
    MchStoreInfoApi.page({ current: 1, size: 200 }).then(({ data }) => {
      storeOptions.value = (data?.records || []).map((item) => ({
        label: item.storeName ? `${item.storeName} (${item.storeNo})` : item.storeNo!,
        value: item.storeNo!,
      }));
    });
  }

  const queryForm = ref<Record<string, any>>({});

  // 查询字段(商户号由后端强制隔离, 不提供 mchNo 条件)
  const queryFields = computed<QueryField[]>(() => [
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

  // 绑定码牌弹窗
  const claimVisible = ref(false);
  const claimLoading = ref(false);
  const claimCode = ref('');

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
      .then((res) => {
        tableData.value = res.data.records || [];
        pageConfig.value.total = Number(res.data.total) || 0;
        // 翻页/刷新后清空勾选, 避免批量操作作用到已不可见的行
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
    // URL 携带 storeNo 时预置门店筛选(门店工作台跳转带入)
    if (route.query.storeNo) {
      queryForm.value.storeNo = String(route.query.storeNo);
    }
    loadSelectOptions();
    queryPage();
  });

  function handleEdit(row: DeviceQrCodeResult) {
    editRef.value?.showEdit(row);
  }

  /**
   * 导出当前查询条件下的码牌清单(时间列由后端按当前用户时区格式化)
   */
  async function handleExport() {
    // 重操作, 先二次确认并复核当前条件的数据量
    if (!(await confirmExport(pageConfig.value.total))) {
      return;
    }
    exporting.value = true;
    // 失败提示已由 downloadExportFile 统一弹出, 此处只复位按钮状态
    await DeviceQrCodeApi.exportExcel(queryForm.value, {
      fileName: `${$t('payment.device.qrcode.exportFileName')}.xlsx`,
      failedText: $t('payment.device.qrcode.exportFailed'),
    }).finally(() => {
      exporting.value = false;
    });
  }

  /**
   * 取勾选 id, 无勾选时提示
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
   * 打开批量绑定应用/门店弹窗
   */
  function handleBindBatch(type: 'bindApp' | 'bindStore') {
    if (!getSelectedIds()) {
      return;
    }
    batchType.value = type;
    batchValue.value = undefined;
    batchVisible.value = true;
  }

  /**
   * 提交批量绑定(应用空=全部应用由编辑页处理, 批量须显式选择)
   */
  async function handleBatchOk() {
    const ids = getSelectedIds();
    if (!ids) {
      return;
    }
    if (!batchValue.value) {
      message.warning(
        batchType.value === 'bindApp'
          ? $t('payment.device.qrcode.pleaseSelectApp')
          : $t('payment.device.qrcode.pleaseSelectStore'),
      );
      return;
    }
    batchSaving.value = true;
    try {
      const request =
        batchType.value === 'bindApp'
          ? DeviceQrCodeApi.bindApp({ ids, appId: batchValue.value })
          : DeviceQrCodeApi.bindStore({ ids, storeNo: batchValue.value });
      await request;
      message.success($t('common.operationSuccess'));
      batchVisible.value = false;
      queryPage();
    } finally {
      batchSaving.value = false;
    }
  }

  /**
   * 批量解绑应用/门店(保留另一方归属)
   */
  function handleUnbindBatch(type: 'unbindApp' | 'unbindStore') {
    const ids = getSelectedIds();
    if (!ids) {
      return;
    }
    confirm({
      content:
        type === 'unbindApp'
          ? $t('payment.device.qrcode.confirmUnbindApp')
          : $t('payment.device.qrcode.confirmUnbindStore'),
      onOk() {
        const request = type === 'unbindApp' ? DeviceQrCodeApi.unbindApp(ids) : DeviceQrCodeApi.unbindStore(ids);
        return request.then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 工具栏批量操作菜单(应用/门店归属批量调整)
   */
  function getBatchActionMenu(): MenuProps {
    return {
      items: [
        { key: 'bindApp', label: $t('payment.device.qrcode.bindApp') },
        { key: 'unbindApp', label: $t('payment.device.qrcode.unbindApp') },
        { type: 'divider' },
        { key: 'bindStore', label: $t('payment.device.qrcode.bindStore') },
        { key: 'unbindStore', label: $t('payment.device.qrcode.unbindStore') },
      ],
      onClick: ({ key }: { key: string }) => {
        switch (key) {
          case 'bindApp': {
            handleBindBatch('bindApp');
            break;
          }
          case 'bindStore': {
            handleBindBatch('bindStore');
            break;
          }
          case 'unbindApp': {
            handleUnbindBatch('unbindApp');
            break;
          }
          case 'unbindStore': {
            handleUnbindBatch('unbindStore');
            break;
          }
        }
      },
    };
  }

  /**
   * 打开绑定码牌弹窗(平台空白码 → 当前商户名下)
   */
  function handleClaimOpen() {
    claimCode.value = '';
    claimVisible.value = true;
  }

  /**
   * 提交绑定
   */
  async function handleClaimOk() {
    if (!claimCode.value.trim()) {
      message.warning($t('payment.device.qrcode.claimRequired'));
      return;
    }
    claimLoading.value = true;
    try {
      await DeviceQrCodeApi.claim({ code: claimCode.value.trim() });
      message.success($t('payment.device.qrcode.claimSuccess'));
      claimVisible.value = false;
      queryPage();
    } finally {
      claimLoading.value = false;
    }
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
              <!-- 绑定码牌: 平台分发的空白码牌按编号绑定到自己商户名下 -->
              <a-button v-if="hasPermission(PermCodes.Device.QrCode.MANAGE)" type="primary" @click="handleClaimOpen">{{
                $t('payment.device.qrcode.claim')
              }}</a-button>
              <!-- 批量操作: 应用/门店归属批量调整(商户归属划拨属运营端, 不在此) -->
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
              <a-button v-if="hasPermission(PermCodes.Device.QrCode.EXPORT)" :loading="exporting" @click="handleExport">
                {{ $t('payment.device.qrcode.export') }}
              </a-button>
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
          <!-- 编码可点, 打开查看码牌弹窗 -->
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
          <!-- 分账码牌: 开启后扫码支付透传分账标识; 产品不支持时自动降级普通收款 -->
          <vxe-column
            field="allocation"
            :title="$t('payment.device.qrcode.field.allocation')"
            :min-width="90"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.allocation" color="green">{{ $t('payment.device.qrcode.allocationOn') }}</a-tag>
              <span v-else style="color: var(--text-color-placeholder)">-</span>
            </template>
          </vxe-column>
          <vxe-column
            field="createTime"
            :title="$t('payment.device.qrcode.field.createTime')"
            :min-width="180"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" width="140" :show-overflow="false" :title="$t('common.operation')">
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

    <!-- 批量绑定应用/门店弹窗: 一次调整勾选码牌的归属 -->
    <a-modal
      v-model:open="batchVisible"
      :title="$t('payment.device.qrcode.batchActions')"
      :width="480"
      :confirm-loading="batchSaving"
      :destroy-on-hidden="true"
      :mask-closable="false"
      @ok="handleBatchOk"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" class="form-compact">
        <a-form-item
          :label="
            batchType === 'bindApp' ? $t('payment.device.qrcode.field.appId') : $t('payment.device.qrcode.field.store')
          "
          required
        >
          <a-select
            v-model:value="batchValue"
            :options="batchType === 'bindApp' ? appOptions : storeOptions"
            :placeholder="
              batchType === 'bindApp'
                ? $t('payment.device.qrcode.pleaseSelectApp')
                : $t('payment.device.qrcode.pleaseSelectStore')
            "
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
      </a-form>
      <div class="px-2 text-xs text-muted-foreground">
        {{ $t('payment.device.qrcode.batchSelected', { count: selectedRows.length }) }}
      </div>
    </a-modal>

    <!-- 认领码牌弹窗: 输入码牌编号将平台空白码认领到当前商户 -->
    <a-modal
      v-model:open="claimVisible"
      :title="$t('payment.device.qrcode.claimTitle')"
      :width="480"
      :confirm-loading="claimLoading"
      :destroy-on-hidden="true"
      :mask-closable="false"
      @ok="handleClaimOk"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" class="form-compact">
        <a-form-item :label="$t('payment.device.qrcode.field.code')" required>
          <a-input
            v-model:value="claimCode"
            :placeholder="$t('payment.device.qrcode.claimCodePlaceholder')"
            :maxlength="100"
            allow-clear
            @press-enter="handleClaimOk"
          />
        </a-form-item>
      </a-form>
      <div class="px-2 text-xs text-muted-foreground">{{ $t('payment.device.qrcode.claimTip') }}</div>
    </a-modal>

    <!-- 查看码牌弹窗: 二维码 + 下方扫码地址 -->
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
