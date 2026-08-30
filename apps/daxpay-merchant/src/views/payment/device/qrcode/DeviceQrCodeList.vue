<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { DeviceQrCodeApi, type DeviceQrCodeResult } from '#/api/payment/device/qrcode.api';
  import { QrCode } from '#/components/qrcode';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import DeviceQrCodeEdit from './DeviceQrCodeEdit.vue';

  defineOptions({ name: 'DeviceQrCodeList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const editRef = ref<InstanceType<typeof DeviceQrCodeEdit>>();

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

  // 认领码牌弹窗
  const claimVisible = ref(false);
  const claimLoading = ref(false);
  const claimCode = ref('');

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

  function handleEdit(row: DeviceQrCodeResult) {
    editRef.value?.showEdit(row);
  }

  /**
   * 打开认领码牌弹窗(平台空白码 → 当前商户名下)
   */
  function handleClaimOpen() {
    claimCode.value = '';
    claimVisible.value = true;
  }

  /**
   * 提交认领
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
              <!-- 认领码牌: 平台分发的空白码牌按编号认领到自己商户名下 -->
              <a-button v-if="hasPermission(PermCodes.Device.QrCode.MANAGE)" type="primary" @click="handleClaimOpen">{{
                $t('payment.device.qrcode.claim')
              }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
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
          <!-- 应用: 名称上+号下小字; 空=默认应用 -->
          <vxe-column field="appId" :title="$t('payment.device.qrcode.field.appId')" :min-width="160">
            <template #default="{ row }">
              <div v-if="row.appId" class="flex flex-col">
                <span>{{ row.appName || '-' }}</span>
                <span class="text-xs text-muted-foreground">{{ row.appId }}</span>
              </div>
              <span v-else style="color: var(--text-color-placeholder)">{{
                $t('payment.device.qrcode.defaultApp')
              }}</span>
            </template>
          </vxe-column>
          <!-- 门店: 名称上+号下小字; 未绑显示「默认门店」提示(支付侧 resolve) -->
          <vxe-column field="storeName" :title="$t('payment.device.qrcode.field.store')" :min-width="160">
            <template #default="{ row }">
              <div v-if="row.storeNo" class="flex flex-col">
                <span>{{ row.storeName || '-' }}</span>
                <span class="text-xs text-muted-foreground">{{ row.storeNo }}</span>
              </div>
              <span v-else style="color: var(--text-color-placeholder)">{{
                $t('payment.device.qrcode.defaultStoreHint')
              }}</span>
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
