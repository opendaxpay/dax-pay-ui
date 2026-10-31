<script lang="ts" setup>
  import type { VxeTableInstance } from 'vxe-table';

  import { nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { DeviceQrCodeApi } from '#/api/payment/device/qrcode.api';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * 门店快捷绑定弹窗(门店详情工作台「快捷绑定」组, 运营端)
   *
   * 弹窗内列出「已绑本商户且未分配门店」的候选码牌, 走服务端分页(查询条件
   * storeUnassigned=true 由后端转 store_no IS NULL); 勾选只作用于当前页(翻页/重查即清空),
   * 确认后走既有 bind-store(ids 批量)一次绑定; 解绑不在本弹窗做(码牌列表页已有解绑入口)。
   * 开源版裁剪: 收款设备(虚拟设备)运营端无调整门店端点, 快捷绑定仅码牌一类。
   */
  defineOptions({ name: 'StoreBindModal' });

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const confirmLoading = ref(false);
  const xTable = ref<VxeTableInstance>();

  // 绑定上下文(目标门店)
  const storeNo = ref('');
  const storeName = ref('');

  // 候选列表(服务端分页, 仅未分配门店)
  const candidates = ref<BindCandidate[]>([]);
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 当前页勾选结果(提交时以表格实例为准)
  const selectedRows = ref<BindCandidate[]>([]);

  /** 候选行 */
  interface BindCandidate {
    /** 主键 */
    id: string;
    /** 码牌编码 */
    code?: string;
    /** 名称 */
    name?: string;
    /** 应用名称 */
    appName?: string;
  }

  /**
   * 收集勾选结果(仅当前页)
   *
   * 多选统一口径: 批量动作只作用于当前页勾选, 翻页/重查后表格勾选即清空。
   */
  function collectChecked(): BindCandidate[] {
    return (xTable.value?.getCheckboxRecords() || []) as BindCandidate[];
  }

  /** 同步当前页勾选结果 */
  function syncSelectedRows() {
    selectedRows.value = collectChecked();
  }

  /**
   * 加载当前页(服务端过滤未分配门店, 按商户号过滤)
   */
  async function queryPage(mchNo: string) {
    loading.value = true;
    try {
      const { data } = await DeviceQrCodeApi.page({
        current: pageConfig.value.currentPage,
        size: pageConfig.value.pageSize,
        mchNo,
        storeUnassigned: true,
      });
      const records = ((data as any)?.records || []) as any[];
      candidates.value = records.map((row) => ({
        id: String(row.id),
        code: row.code,
        name: row.name,
        appName: row.appName,
      }));
      pageConfig.value.total = Number((data as any)?.total) || 0;
      // 等表格换页渲染完成再回读, 否则读到的是上一页的勾选
      await nextTick();
      syncSelectedRows();
    } finally {
      loading.value = false;
    }
  }

  /** 当前商户号(打开时注入, 分页翻页沿用) */
  const mchNo = ref('');

  /**
   * 打开弹窗
   *
   * @param ctx 目标门店上下文(mchNo + storeNo + storeName)
   */
  function show(ctx: { mchNo: string; storeName?: string; storeNo: string }) {
    mchNo.value = ctx.mchNo;
    storeNo.value = ctx.storeNo;
    storeName.value = ctx.storeName || '';
    pageConfig.value.currentPage = 1;
    pageConfig.value.total = 0;
    candidates.value = [];
    selectedRows.value = [];
    visible.value = true;
    queryPage(ctx.mchNo);
  }

  /** 翻页(重查后勾选清空, 只处理当前页) */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage(mchNo.value);
  }

  /** 勾选变化 */
  function handleCheckboxChange() {
    syncSelectedRows();
  }

  function handleCancel() {
    visible.value = false;
  }

  /**
   * 确认绑定: 一次批量提交(bind-store ids 批量)
   */
  async function handleOk() {
    const checked = collectChecked();
    if (checked.length === 0) {
      // 请先勾选码牌
      message.warning($t('payment.merchant.store.bind.selectFirstQrcode'));
      return;
    }
    const ids = checked.map((row) => row.id);
    confirmLoading.value = true;
    try {
      await DeviceQrCodeApi.bindStore({ ids, storeNo: storeNo.value });
      // 绑定成功提示(带数量与门店名)
      message.success(
        $t('payment.merchant.store.bind.successQrcode', {
          count: ids.length,
          store: storeName.value || storeNo.value,
        }),
      );
      visible.value = false;
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ show });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="$t('payment.merchant.store.workbench.tileBindQrcode')"
    :width="720"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
    :mask-closable="false"
    :ok-text="
      selectedRows.length > 0
        ? $t('payment.merchant.store.bind.okWithCount', { count: selectedRows.length })
        : $t('payment.merchant.store.bind.ok')
    "
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="loading">
      <div class="flex flex-col gap-3">
        <!-- 候选范围说明 -->
        <a-alert
          type="info"
          show-icon
          :message="
            $t('payment.merchant.store.bind.alertTemplate', { kind: $t('payment.merchant.store.bind.kindQrcode') })
          "
        />
        <div class="flex flex-col gap-2">
          <vxe-table
            ref="xTable"
            :row-config="{ keyField: 'id' }"
            :data="candidates"
            :loading="loading"
            min-height="120"
            max-height="360"
            @checkbox-all="handleCheckboxChange"
            @checkbox-change="handleCheckboxChange"
          >
            <vxe-column type="checkbox" width="50" />
            <vxe-column field="code" :title="$t('payment.merchant.store.bind.columnCode')" :min-width="180" />
            <vxe-column field="name" :title="$t('payment.merchant.store.bind.columnName')" :min-width="140">
              <template #default="{ row }">
                <span>{{ row.name || '-' }}</span>
              </template>
            </vxe-column>
            <vxe-column
              field="appName"
              :title="$t('payment.merchant.store.bind.columnApp')"
              :min-width="140"
              show-overflow
            >
              <template #default="{ row }">
                <span>{{ row.appName || $t('payment.merchant.store.bind.allApps') }}</span>
              </template>
            </vxe-column>
          </vxe-table>
          <vxe-pager
            size="small"
            :current-page="pageConfig.currentPage"
            :page-size="pageConfig.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="pageConfig.total"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>
