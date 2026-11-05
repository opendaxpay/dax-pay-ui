<script lang="ts" setup>
  import type { VxeTableInstance } from 'vxe-table';

  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { DeviceQrCodeApi } from '#/api/payment/device/qrcode.api';
  import { TerminalDeviceApi } from '#/api/payment/device/terminal.api';
  import { VirtualDeviceApi } from '#/api/payment/device/virtual.api';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * 门店快捷绑定弹窗(门店详情工作台「快捷绑定」组, 运营端)
   *
   * 弹窗内列出「已绑本商户且未分配门店」的候选对象:
   * 码牌/系统终端走服务端分页(查询条件 storeUnassigned=true 由后端转 store_no IS NULL);
   * 收款设备(虚拟设备)查询接口无未分配过滤参数, 拉该商户全量后客户端过滤未分配再前端分页。
   * 勾选只作用于当前页(翻页/重查即清空), 确认后按类别一次批量绑定:
   * 码牌走既有 bind-store(ids 批量), 系统终端走 bind-store-batch, 收款设备走 bind-store-batch;
   * 绑定带默认标记的终端由后端清除默认, 前端提交前二次确认;
   * 解绑不在本弹窗做(各列表页已有解绑入口)。
   */
  defineOptions({ name: 'StoreBindModal' });

  const emit = defineEmits(['ok']);

  const { message, confirm } = useMessage();

  /** 绑定对象类别 */
  type BindKind = 'qrcode' | 'terminal' | 'virtual';

  /** 打开模式: device=收款设备(虚拟设备) / qrcode=码牌 / terminal=系统终端 */
  type BindMode = 'device' | 'qrcode' | 'terminal';

  const visible = ref(false);
  const loading = ref(false);
  const confirmLoading = ref(false);
  const xTable = ref<VxeTableInstance>();

  // 绑定上下文(目标门店)
  const mchNo = ref('');
  const storeNo = ref('');
  const storeName = ref('');
  // 当前模式与绑定类别
  const mode = ref<BindMode>('qrcode');
  const kind = computed<BindKind>(() =>
    mode.value === 'qrcode' ? 'qrcode' : mode.value === 'terminal' ? 'terminal' : 'virtual',
  );

  // 候选列表(当前页)
  const candidates = ref<BindCandidate[]>([]);
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 当前页勾选结果(提交时以表格实例为准)
  const selectedRows = ref<BindCandidate[]>([]);

  // 收款设备全量候选(未分配门店, 客户端分页)
  let virtualCandidates: BindCandidate[] = [];

  /** 候选行(收款设备/码牌/系统终端统一展示形状) */
  interface BindCandidate {
    /** 主键 */
    id: string;
    /** 设备号(收款设备) / 终端号(系统终端) */
    deviceNo?: string;
    /** 码牌编码(码牌) */
    code?: string;
    /** 名称 */
    name?: string;
    /** 应用名称 */
    appName?: string;
    /** 是否门店默认终端(系统终端; 绑定到本店后由后端清除默认) */
    defaultTerminal?: boolean;
  }

  /** 类别展示名(提示文案用) */
  const kindLabel = computed(() =>
    kind.value === 'qrcode'
      ? $t('payment.merchant.store.bind.kindQrcode')
      : kind.value === 'terminal'
        ? $t('payment.merchant.store.bind.kindTerminal')
        : $t('payment.merchant.store.workbench.tileDevice'),
  );

  /** 弹窗标题 */
  const modalTitle = computed(() =>
    kind.value === 'qrcode'
      ? $t('payment.merchant.store.workbench.tileBindQrcode')
      : kind.value === 'terminal'
        ? $t('payment.merchant.store.workbench.tileBindTerminal')
        : $t('payment.merchant.store.workbench.tileBindDevice'),
  );

  /** 确认按钮带当前页勾选数量 */
  const okText = computed(() =>
    selectedRows.value.length > 0
      ? $t('payment.merchant.store.bind.okWithCount', { count: selectedRows.value.length })
      : $t('payment.merchant.store.bind.ok'),
  );

  /** 分页行 -> 候选行 */
  function toCandidate(row: any): BindCandidate {
    return {
      id: String(row.id),
      // 系统终端的编号字段是 terminalNo, 统一落到设备号列
      deviceNo: row.deviceNo || row.terminalNo,
      code: row.code,
      name: row.name,
      appName: row.appName,
      defaultTerminal: row.defaultTerminal,
    };
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
   * 加载当前页(码牌/系统终端服务端过滤未分配门店; 收款设备客户端过滤后前端分页)
   */
  async function queryPage() {
    loading.value = true;
    try {
      const { currentPage, pageSize } = pageConfig.value;
      if (kind.value === 'qrcode') {
        const { data } = await DeviceQrCodeApi.page({
          current: currentPage,
          size: pageSize,
          mchNo: mchNo.value,
          storeUnassigned: true,
        });
        const records = ((data as any)?.records || []) as any[];
        candidates.value = records.map((row) => toCandidate(row));
        pageConfig.value.total = Number((data as any)?.total) || 0;
      } else if (kind.value === 'terminal') {
        const { data } = await TerminalDeviceApi.page({
          current: currentPage,
          size: pageSize,
          mchNo: mchNo.value,
          storeUnassigned: true,
        });
        const records = ((data as any)?.records || []) as any[];
        candidates.value = records.map((row) => toCandidate(row));
        pageConfig.value.total = Number((data as any)?.total) || 0;
      } else {
        // 首页拉该商户全量并过滤未分配(商户设备量级小), 其后页直接切片
        if (currentPage === 1 || virtualCandidates.length === 0) {
          const { data } = await VirtualDeviceApi.page({ current: 1, size: 500, mchNo: mchNo.value });
          virtualCandidates = ((data as any)?.records || [])
            .filter((row: any) => !row.storeNo)
            .map((row: any) => toCandidate(row));
        }
        const start = (currentPage - 1) * pageSize;
        candidates.value = virtualCandidates.slice(start, start + pageSize);
        pageConfig.value.total = virtualCandidates.length;
      }
      // 等表格换页渲染完成再回读, 否则读到的是上一页的勾选
      await nextTick();
      syncSelectedRows();
    } finally {
      loading.value = false;
    }
  }

  /**
   * 打开弹窗
   *
   * @param bindMode device=收款设备(虚拟设备) / qrcode=码牌 / terminal=系统终端
   * @param ctx 目标门店上下文(mchNo + storeNo + storeName)
   */
  function show(bindMode: BindMode, ctx: { mchNo: string; storeName?: string; storeNo: string }) {
    mode.value = bindMode;
    mchNo.value = ctx.mchNo;
    storeNo.value = ctx.storeNo;
    storeName.value = ctx.storeName || '';
    pageConfig.value.currentPage = 1;
    pageConfig.value.total = 0;
    candidates.value = [];
    selectedRows.value = [];
    virtualCandidates = [];
    visible.value = true;
    queryPage();
  }

  /** 翻页(重查后勾选清空, 只处理当前页) */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  /** 勾选变化 */
  function handleCheckboxChange() {
    syncSelectedRows();
  }

  function handleCancel() {
    visible.value = false;
  }

  /**
   * 确认绑定: 一次批量提交(码牌 bind-store, 系统终端/收款设备 bind-store-batch)
   */
  async function handleOk() {
    const checked = collectChecked();
    if (checked.length === 0) {
      // 未勾选提示(区分码牌/终端/设备)
      message.warning(
        kind.value === 'qrcode'
          ? $t('payment.merchant.store.bind.selectFirstQrcode')
          : kind.value === 'terminal'
            ? $t('payment.merchant.store.bind.selectFirstTerminal')
            : $t('payment.merchant.store.bind.selectFirstDevice'),
      );
      return;
    }
    // 绑定带默认标记的终端会清除其默认(默认终端同门店唯一), 提交前二次确认
    if (kind.value === 'terminal' && checked.some((row) => row.defaultTerminal)) {
      const ok = await new Promise<boolean>((resolve) => {
        confirm({
          content: $t('payment.merchant.store.bind.confirmBindDefaultTerminal'),
          okButtonProps: { danger: true },
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (!ok) {
        return;
      }
    }
    const ids = checked.map((row) => row.id);
    confirmLoading.value = true;
    try {
      if (kind.value === 'qrcode') {
        await DeviceQrCodeApi.bindStore({ ids, storeNo: storeNo.value });
      } else if (kind.value === 'terminal') {
        await TerminalDeviceApi.bindStoreBatch({ terminalIds: ids, storeNo: storeNo.value });
      } else {
        await VirtualDeviceApi.bindStoreBatch({ deviceIds: ids, storeNo: storeNo.value });
      }
      // 绑定成功提示(带数量与门店名)
      message.success(
        kind.value === 'qrcode'
          ? $t('payment.merchant.store.bind.successQrcode', {
              count: ids.length,
              store: storeName.value || storeNo.value,
            })
          : kind.value === 'terminal'
            ? $t('payment.merchant.store.bind.successTerminal', {
                count: ids.length,
                store: storeName.value || storeNo.value,
              })
            : $t('payment.merchant.store.bind.successDevice', {
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
    :title="modalTitle"
    :width="720"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
    :mask-closable="false"
    :ok-text="okText"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="loading">
      <div class="flex flex-col gap-3">
        <!-- 候选范围说明 -->
        <a-alert
          type="info"
          show-icon
          :message="$t('payment.merchant.store.bind.alertTemplate', { kind: kindLabel })"
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
            <vxe-column
              v-if="kind === 'qrcode'"
              field="code"
              :title="$t('payment.merchant.store.bind.columnCode')"
              :min-width="180"
            />
            <vxe-column
              v-else-if="kind === 'terminal'"
              field="deviceNo"
              :title="$t('payment.merchant.store.bind.columnTerminalNo')"
              :min-width="180"
            />
            <vxe-column
              v-else
              field="deviceNo"
              :title="$t('payment.merchant.store.bind.columnDeviceNo')"
              :min-width="180"
            />
            <vxe-column field="name" :title="$t('payment.merchant.store.bind.columnName')" :min-width="140">
              <template #default="{ row }">
                <span>{{ row.name || '-' }}</span>
              </template>
            </vxe-column>
            <vxe-column
              v-if="kind !== 'terminal'"
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
