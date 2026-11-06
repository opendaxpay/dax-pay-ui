<script lang="ts" setup>
  import type { DeviceTestParam } from '@daxpay/ui-biz/components/device-test';
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { IconifyIcon } from '@vben-core/icons';

  import { DeviceTestDialog } from '@daxpay/ui-biz/components/device-test';
  import { NameNoCell } from '@daxpay/ui-biz/components/name-no-cell';
  import { confirmExport } from '@daxpay/ui-biz/utils/export-download';

  import { VirtualDeviceApi, type VirtualDeviceResult } from '#/api/payment/device/virtual.api';
  import { MchAppInfoApi } from '#/api/payment/merchant/mch-app-info.api';
  import { MchStoreInfoApi } from '#/api/payment/merchant/store.api';
  import { QrCode } from '#/components/qrcode';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  /**
   * 收款设备(虚拟设备)列表(商户端)
   *
   * 商户自查名下收款设备(手机 APP 变云音箱/云打印): 查询筛选 / 应用与门店归属调整 / 启停 /
   * 行操作激活二维码(商户手机装 APP 后扫码即完成设备激活) / 试播试打。
   */
  defineOptions({ name: 'MchVirtualDeviceList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();
  const route = useRoute();

  const loading = ref(false);
  // 导出中标记(服务端为内存生成, 期间禁用按钮防重复提交)
  const exporting = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 勾选行(仅当前页, 查询/翻页后清空)
  const selectedRows = ref<VirtualDeviceResult[]>([]);

  // 试播/试打弹窗(共享组件来自 ui-biz, 接口由本页注入商户端端点)
  const testOpen = ref(false);
  const testMode = ref<'announce' | 'print'>('announce');
  const testDevice = ref<VirtualDeviceResult>();

  // 下拉选项(应用/门店仅展示基础信息, 商户号由登录态隔离)
  const appOptions = ref<{ label: string; value: string }[]>([]);
  const storeOptions = ref<{ label: string; value: string }[]>([]);

  const queryForm = ref<Record<string, any>>({});

  // 查询字段(设备号/应用/门店/启用状态)
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'deviceNo',
      // 设备号
      name: $t('payment.device.virtual.field.deviceNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'appId',
      // 应用
      name: $t('payment.device.virtual.field.appId'),
      placeholder: $t('common.pleaseSelect'),
      selectList: appOptions.value,
    },
    {
      type: 'list',
      field: 'storeNo',
      // 门店
      name: $t('payment.device.virtual.field.storeNo'),
      placeholder: $t('common.pleaseSelect'),
      selectList: storeOptions.value,
    },
    {
      type: 'list',
      field: 'enable',
      // 状态
      name: $t('payment.device.virtual.field.enable'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('common.enable'), value: true },
        { label: $t('common.disable'), value: false },
      ],
    },
  ]);

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<VirtualDeviceResult[]>([]);

  /**
   * 加载应用/门店下拉(商户端由登录态隔离, 无需传 mchNo)
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

  /**
   * 分页查询收款设备
   */
  function queryPage() {
    loading.value = true;
    VirtualDeviceApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res) => {
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

  /**
   * 同步勾选行
   */
  function handleCheckboxChange() {
    selectedRows.value = (xTable.value?.getCheckboxRecords() || []) as VirtualDeviceResult[];
  }

  /**
   * 获取勾选 id, 无勾选时给出提示
   */
  function getSelectedIds(): null | string[] {
    const ids = selectedRows.value.map((row) => row.id!).filter(Boolean);
    if (ids.length === 0) {
      message.warning($t('payment.device.virtual.selectRequired'));
      return null;
    }
    return ids;
  }

  /**
   * 导出当前查询条件下的收款设备清单(时间列由后端按当前用户时区格式化)
   */
  async function handleExport() {
    // 重操作, 先二次确认并复核当前条件的数据量
    if (!(await confirmExport(pageConfig.value.total))) {
      return;
    }
    exporting.value = true;
    // 失败提示已由 downloadExportFile 统一弹出, 此处只复位按钮状态
    await VirtualDeviceApi.exportExcel(queryForm.value, {
      fileName: `${$t('payment.device.virtual.exportFileName')}.xlsx`,
      failedText: $t('payment.device.virtual.exportFailed'),
    }).finally(() => {
      exporting.value = false;
    });
  }

  /** 设备展示名(确认弹窗等提示用) */
  function displayName(row: VirtualDeviceResult): string {
    return row.name || row.deviceNo || '-';
  }

  // ===== 设备配置抽屉 =====
  interface ConfigFormState {
    appId?: string;
    id?: string;
    storeNo?: string;
  }

  const configVisible = ref(false);
  const configLoading = ref(false);
  const configSaving = ref(false);
  const configRow = ref<VirtualDeviceResult>();
  const configForm = ref<ConfigFormState>({});
  // 打开时记录原归属, 保存时 diff 决定是否调用 bind 接口
  const originalAppId = ref<string>();
  const originalStoreNo = ref<string>();

  /**
   * 打开配置抽屉(拉取最新详情, 避免列表快照过期)
   */
  async function handleConfig(row: VirtualDeviceResult) {
    configRow.value = row;
    configVisible.value = true;
    configLoading.value = true;
    try {
      const { data } = await VirtualDeviceApi.get(row.id!);
      const detail = data || row;
      configForm.value = {
        id: detail.id!,
        appId: detail.appId || undefined,
        storeNo: detail.storeNo || undefined,
      };
      originalAppId.value = detail.appId || undefined;
      originalStoreNo.value = detail.storeNo || undefined;
    } finally {
      configLoading.value = false;
    }
  }

  /**
   * 保存配置: 应用/门店归属变化时 diff 调 bind/unbind
   */
  async function handleConfigSave() {
    const id = configForm.value.id;
    if (!id) {
      return;
    }
    configSaving.value = true;
    try {
      // 应用归属变化: 空值即「全部应用」
      const appId = configForm.value.appId || undefined;
      if (appId !== originalAppId.value) {
        await VirtualDeviceApi.bindApp({ id, appId });
      }
      // 门店归属变化: 空值走解绑(未分配, 不参与播报/打印)
      const storeNo = configForm.value.storeNo || undefined;
      if (storeNo !== originalStoreNo.value) {
        await (storeNo ? VirtualDeviceApi.bindStore({ id, storeNo }) : VirtualDeviceApi.unbindStore(id));
      }
      message.success($t('common.saveSuccess'));
      configVisible.value = false;
      queryPage();
    } finally {
      configSaving.value = false;
    }
  }

  // ===== 编辑设备名称弹窗 =====
  const editVisible = ref(false);
  const editSaving = ref(false);
  const editRow = ref<VirtualDeviceResult>();
  const editForm = ref<{ id?: string; name?: string }>({});

  /**
   * 打开编辑弹窗(仅名称可改, 设备号与归属不可改, 归属走配置抽屉)
   */
  function handleEdit(row: VirtualDeviceResult) {
    editRow.value = row;
    editForm.value = { id: row.id || undefined, name: row.name || undefined };
    editVisible.value = true;
  }

  /**
   * 提交改名
   */
  async function handleEditSave() {
    const { id, name } = editForm.value;
    if (!id || !name?.trim()) {
      return;
    }
    editSaving.value = true;
    try {
      await VirtualDeviceApi.update({ id, name: name.trim() });
      message.success($t('common.saveSuccess'));
      editVisible.value = false;
      queryPage();
    } finally {
      editSaving.value = false;
    }
  }

  // ===== 批量操作(应用/门店归属) =====
  const batchVisible = ref(false);
  const batchSaving = ref(false);
  // 批量模式: app=绑定应用, store=绑定门店
  const batchMode = ref<'app' | 'store'>('app');
  // 本次批量操作的设备主键(打开弹窗时快照, 避免弹窗期间勾选变化)
  const batchIds = ref<string[]>([]);
  const batchForm = ref<{ appId?: string; storeNo?: string }>({});

  /**
   * 批量绑定应用(空=全部应用)
   */
  function handleBatchBindApp() {
    const ids = getSelectedIds();
    if (!ids) {
      return;
    }
    batchMode.value = 'app';
    batchIds.value = ids;
    batchForm.value = {};
    batchVisible.value = true;
  }

  /**
   * 批量绑定门店
   */
  function handleBatchBindStore() {
    const ids = getSelectedIds();
    if (!ids) {
      return;
    }
    batchMode.value = 'store';
    batchIds.value = ids;
    batchForm.value = {};
    batchVisible.value = true;
  }

  /**
   * 批量解绑门店(置为未分配, 不再参与播报/打印; 危险操作二次确认)
   */
  function handleBatchUnbindStore() {
    const ids = getSelectedIds();
    if (!ids) {
      return;
    }
    confirm({
      // 解绑门店(未分配)后设备不再参与播报/打印
      content: $t('payment.device.virtual.confirmUnbindStore'),
      onOk() {
        // 门店号留空即解绑门店
        return VirtualDeviceApi.bindStoreBatch({ ids }).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 提交批量绑定(应用/门店共用弹窗, 按模式分流)
   */
  async function handleBatchSave() {
    batchSaving.value = true;
    try {
      // 空应用号即全部应用; 门店号已在提交前校验必选
      const request =
        batchMode.value === 'app'
          ? VirtualDeviceApi.bindAppBatch({ ids: batchIds.value, appId: batchForm.value.appId || undefined })
          : VirtualDeviceApi.bindStoreBatch({ ids: batchIds.value, storeNo: batchForm.value.storeNo || undefined });
      await request;
      message.success($t('common.operationSuccess'));
      batchVisible.value = false;
      queryPage();
    } finally {
      batchSaving.value = false;
    }
  }

  /**
   * 工具栏批量操作菜单(绑定应用/绑定门店/解绑门店)
   *
   * a-dropdown 的 menu prop 要求 MenuProps 对象(items+onClick), 传裸数组会因 menu.items
   * 为空导致弹出层渲染为空(点击无反应)——全站统一走 items+onClick 形态
   */
  function getBatchActionMenu(): MenuProps {
    return {
      items: [
        { key: 'bindApp', label: $t('payment.device.virtual.bindApp') },
        { key: 'bindStore', label: $t('payment.device.virtual.bindStore') },
        { key: 'unbindStore', label: $t('payment.device.virtual.unbindStore'), danger: true },
      ],
      onClick: ({ key }: { key: string }) => {
        switch (key) {
          case 'bindApp': {
            handleBatchBindApp();
            break;
          }
          case 'bindStore': {
            handleBatchBindStore();
            break;
          }
          case 'unbindStore': {
            handleBatchUnbindStore();
            break;
          }
        }
      },
    };
  }

  // ===== 激活二维码弹窗 =====
  const qrVisible = ref(false);
  const qrLoading = ref(false);
  const qrContentStr = ref('');

  /**
   * 打开激活二维码弹窗(调 qr-content 拿内容字符串后本地渲染二维码)
   */
  function handleQrCode(row: VirtualDeviceResult) {
    if (!row.deviceNo) {
      return;
    }
    qrLoading.value = true;
    qrVisible.value = true;
    qrContentStr.value = '';
    VirtualDeviceApi.qrContent(row.deviceNo)
      .then((res) => {
        qrContentStr.value = res.data || '';
      })
      .finally(() => {
        qrLoading.value = false;
      });
  }

  /**
   * 复制激活二维码内容(供 APP 手工填入设备号兜底)
   */
  async function handleCopyQrContent() {
    if (!qrContentStr.value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(qrContentStr.value);
      message.success($t('common.copySuccess'));
    } catch {
      message.error($t('common.copyFail'));
    }
  }

  // ===== 设备操作 =====
  /**
   * 启用/停用设备
   */
  function handleChangeEnable(row: VirtualDeviceResult, enable: boolean) {
    confirm({
      // 启用/停用确认文案(带设备名)
      content: enable
        ? $t('payment.device.virtual.confirmEnable', { name: displayName(row) })
        : $t('payment.device.virtual.confirmDisable', { name: displayName(row) }),
      onOk() {
        return VirtualDeviceApi.changeEnable(row.id!, enable).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 试播(可调金额与收款方式; 弹窗内含预计播报文案)
   */
  function handleTestBroadcast(row: VirtualDeviceResult) {
    testDevice.value = row;
    testMode.value = 'announce';
    testOpen.value = true;
  }

  /**
   * 试打(内置版式渲染, 先预览后出纸由共享弹窗控制)
   */
  function handleTestPrint(row: VirtualDeviceResult) {
    testDevice.value = row;
    testMode.value = 'print';
    testOpen.value = true;
  }

  /** 下发成功后刷新列表(回执状态异步写入, 轻刷新一次) */
  function handleTestSent() {
    queryPage();
  }

  /** 试播预计文案取数(命名函数, 避免模板内联箭头的 ref 解包歧义) */
  function fetchTestSpeech(amountFen: number, channel: string): Promise<string> {
    return VirtualDeviceApi.testSpeech({ amountFen, channel }).then((res) => res.data ?? '');
  }

  /** 试播/试打下发(弹窗组好参后由本函数调对应端点) */
  function submitTest(param: DeviceTestParam): Promise<string> {
    const request =
      testMode.value === 'announce' ? VirtualDeviceApi.testBroadcast(param) : VirtualDeviceApi.testPrint(param);
    return request.then((res) => res.data ?? '');
  }

  /**
   * 操作列更多菜单(编辑名称/试播/试打/激活二维码/启停)
   */
  function getActionMenu(row: VirtualDeviceResult): MenuProps {
    const items: MenuProps['items'] = [
      {
        key: 'edit',
        // 编辑名称(仅改名, 归属调整走配置抽屉)
        label: $t('payment.device.virtual.edit'),
      },
      { type: 'divider' },
      {
        key: 'testBroadcast',
        // 试播
        label: $t('payment.device.virtual.action.testBroadcast'),
      },
      {
        key: 'testPrint',
        // 试打
        label: $t('payment.device.virtual.action.testPrint'),
      },
      {
        key: 'qrCode',
        // 激活二维码
        label: $t('payment.device.virtual.action.qrCode'),
      },
      { type: 'divider' },
      row.enable
        ? {
            key: 'disable',
            // 停用(危险操作)
            label: $t('common.disable'),
            danger: true,
          }
        : {
            key: 'enable',
            // 启用
            label: $t('common.enable'),
          },
    ];
    return {
      items,
      onClick: ({ key }: { key: string }) => {
        switch (key) {
          case 'disable': {
            handleChangeEnable(row, false);
            break;
          }
          case 'edit': {
            handleEdit(row);
            break;
          }
          case 'enable': {
            handleChangeEnable(row, true);
            break;
          }
          case 'qrCode': {
            handleQrCode(row);
            break;
          }
          case 'testBroadcast': {
            handleTestBroadcast(row);
            break;
          }
          case 'testPrint': {
            handleTestPrint(row);
            break;
          }
        }
      },
    };
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    // URL 携带 storeNo 时预置门店筛选(门店工作台跳转带入; 门店下拉异步加载后回显名称)
    if (route.query.storeNo) {
      queryForm.value.storeNo = String(route.query.storeNo);
    }
    loadSelectOptions();
    queryPage();
  });
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery
        :fields="queryFields"
        :query-params="queryForm"
        :default-item-count="4"
        @query="queryPage"
        @reset="resetQuery"
      />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <!-- 批量操作: 绑定应用/绑定门店/解绑门店(无权限或无勾选时禁用) -->
              <a-dropdown
                :disabled="!hasPermission(PermCodes.Device.Virtual.MANAGE) || selectedRows.length === 0"
                :menu="getBatchActionMenu()"
              >
                <a-button :disabled="!hasPermission(PermCodes.Device.Virtual.MANAGE) || selectedRows.length === 0">
                  {{ $t('payment.device.virtual.batchActions') }}
                  <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                </a-button>
              </a-dropdown>
              <a-button v-if="hasPermission(PermCodes.Device.Virtual.EXPORT)" :loading="exporting" @click="handleExport">
                {{ $t('payment.device.virtual.export') }}
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
          <vxe-column field="name" :title="$t('payment.device.virtual.column.device')" :min-width="240">
            <template #default="{ row }">
              <!-- 名称(设备号)单行: 名称为主体, 设备号灰字缀后 -->
              <NameNoCell :name="row.name" :no="row.deviceNo" />
            </template>
          </vxe-column>
          <vxe-column field="appId" :title="$t('payment.device.virtual.column.app')" :min-width="150">
            <template #default="{ row }">
              <span v-if="row.appId">{{ row.appName || row.appId }}</span>
              <!-- 空应用号表示全部应用 -->
              <span v-else class="text-muted-foreground">{{ $t('payment.device.virtual.allApps') }}</span>
            </template>
          </vxe-column>
          <vxe-column field="storeNo" :title="$t('payment.device.virtual.column.store')" :min-width="150">
            <template #default="{ row }">
              <span v-if="row.storeNo">{{ row.storeName || row.storeNo }}</span>
              <!-- 空门店表示未分配 -->
              <span v-else class="text-muted-foreground">{{ $t('payment.device.virtual.unassigned') }}</span>
            </template>
          </vxe-column>
          <vxe-column field="enable" :title="$t('payment.device.virtual.column.enable')" :min-width="90" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.enable" color="green">{{ $t('common.enable') }}</a-tag>
              <a-tag v-else color="default">{{ $t('common.disable') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 运行状态: 未激活优先(未激活无从判在线), 其次在线/离线(心跳 15 分钟窗口) -->
          <vxe-column
            field="online"
            :title="$t('payment.device.virtual.column.runStatus')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <template v-if="row.vendor === 'virtual'">
                <a-tag v-if="row.activated === false" color="default">
                  {{ $t('payment.device.virtual.runStatus.notActivated') }}
                </a-tag>
                <a-tag v-else-if="row.online" color="green">{{ $t('payment.device.virtual.runStatus.online') }}</a-tag>
                <a-tag v-else color="red">{{ $t('payment.device.virtual.runStatus.offline') }}</a-tag>
              </template>
              <span v-else style="color: var(--text-color-placeholder)">-</span>
            </template>
          </vxe-column>
          <!-- 最后在线时间(心跳节流落库, 非实时值; 未激活设备无从判断) -->
          <vxe-column field="lastOnlineTime" :title="$t('payment.device.virtual.column.lastOnline')" :min-width="180">
            <template #default="{ row }">
              <span v-if="row.vendor === 'virtual' && row.activated !== false && row.lastOnlineTime">
                {{ formatDateTime(row.lastOnlineTime) }}
              </span>
              <span v-else style="color: var(--text-color-placeholder)">-</span>
            </template>
          </vxe-column>
          <vxe-column
            v-if="hasPermission(PermCodes.Device.Virtual.MANAGE)"
            fixed="right"
            :width="200"
            :show-overflow="false"
            :title="$t('common.operation')"
          >
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleConfig(row)">
                  {{ $t('payment.device.virtual.action.config') }}
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

    <!-- 设备配置抽屉: 应用/门店归属 -->
    <a-drawer
      v-model:open="configVisible"
      :title="$t('payment.device.virtual.config.title')"
      :default-size="600"
      resizable
      :destroy-on-hidden="true"
    >
      <a-spin :spinning="configLoading">
        <a-form layout="vertical" class="form-compact">
          <a-form-item :label="$t('payment.device.virtual.column.device')">
            <span class="text-muted-foreground">
              {{ configRow?.name || '-' }}（{{ configRow?.deviceNo || '-' }}）
            </span>
          </a-form-item>
          <a-form-item :label="$t('payment.device.virtual.column.app')">
            <a-select
              v-model:value="configForm.appId"
              :options="appOptions"
              :placeholder="$t('payment.device.virtual.allApps')"
              allow-clear
              show-search
              option-filter-prop="label"
            />
            <!-- 留空表示全部应用 -->
            <div class="mt-1 text-xs text-muted-foreground">{{ $t('payment.device.virtual.config.appHint') }}</div>
          </a-form-item>
          <a-form-item :label="$t('payment.device.virtual.column.store')">
            <a-select
              v-model:value="configForm.storeNo"
              :options="storeOptions"
              :placeholder="$t('payment.device.virtual.unassigned')"
              allow-clear
              show-search
              option-filter-prop="label"
            />
            <!-- 未分配门店将不参与播报/打印 -->
            <div class="mt-1 text-xs text-muted-foreground">{{ $t('payment.device.virtual.config.storeHint') }}</div>
          </a-form-item>
        </a-form>
      </a-spin>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <a-button @click="configVisible = false">{{ $t('common.cancel') }}</a-button>
          <a-button type="primary" :loading="configSaving" @click="handleConfigSave">
            {{ $t('common.save') }}
          </a-button>
        </div>
      </template>
    </a-drawer>

    <!-- 编辑设备名称: 仅名称可改, 设备号与归属变更走配置抽屉 -->
    <a-modal
      v-model:open="editVisible"
      :title="$t('payment.device.virtual.editTitle')"
      :width="480"
      :destroy-on-hidden="true"
      :confirm-loading="editSaving"
      :ok-button-props="{ disabled: !editForm.name?.trim() }"
      @ok="handleEditSave"
    >
      <a-form layout="vertical" class="form-compact">
        <a-form-item :label="$t('payment.device.virtual.column.device')">
          <span class="text-muted-foreground">{{ editRow?.deviceNo || '-' }}</span>
        </a-form-item>
        <a-form-item :label="$t('payment.device.virtual.name')" required>
          <a-input
            v-model:value="editForm.name"
            :maxlength="128"
            :placeholder="$t('payment.device.virtual.namePlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 批量绑定: 应用/门店共用弹窗, 按当前批量模式渲染 -->
    <a-modal
      v-model:open="batchVisible"
      :title="batchMode === 'app' ? $t('payment.device.virtual.bindApp') : $t('payment.device.virtual.bindStore')"
      :width="520"
      :destroy-on-hidden="true"
      :confirm-loading="batchSaving"
      :ok-button-props="{ disabled: batchMode === 'store' && !batchForm.storeNo }"
      @ok="handleBatchSave"
    >
      <a-form layout="vertical" class="form-compact">
        <!-- 本次批量操作的设备台数 -->
        <div class="mb-3 text-xs text-muted-foreground">
          {{ $t('payment.device.virtual.batchSelected', { count: batchIds.length }) }}
        </div>
        <a-form-item v-if="batchMode === 'app'" :label="$t('payment.device.virtual.field.appId')">
          <a-select
            v-model:value="batchForm.appId"
            :options="appOptions"
            :placeholder="$t('payment.device.virtual.allApps')"
            allow-clear
            show-search
            option-filter-prop="label"
          />
          <!-- 留空表示全部应用 -->
          <div class="mt-1 text-xs text-muted-foreground">{{ $t('payment.device.virtual.config.appHint') }}</div>
        </a-form-item>
        <a-form-item v-else :label="$t('payment.device.virtual.field.storeNo')">
          <a-select
            v-model:value="batchForm.storeNo"
            :options="storeOptions"
            :placeholder="$t('common.pleaseSelect')"
            show-search
            option-filter-prop="label"
          />
          <!-- 解绑门店请走「解绑门店」操作 -->
          <div class="mt-1 text-xs text-muted-foreground">{{ $t('payment.device.virtual.config.storeHint') }}</div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 激活二维码弹窗: 商户手机装 APP 后扫码即完成设备激活 -->
    <a-modal
      v-model:open="qrVisible"
      :title="$t('payment.device.virtual.qr.title')"
      :width="420"
      :footer="null"
      :destroy-on-hidden="true"
    >
      <a-spin :spinning="qrLoading">
        <div class="qr-modal">
          <p class="qr-tip">{{ $t('payment.device.virtual.qr.tip') }}</p>
          <div v-if="qrContentStr" class="qr-card">
            <QrCode :value="qrContentStr" :width="250" :margin="0" />
          </div>
          <div class="qr-content">{{ qrContentStr || '-' }}</div>
          <a-button type="primary" block :disabled="!qrContentStr" @click="handleCopyQrContent">
            {{ $t('payment.device.virtual.qr.copy') }}
          </a-button>
        </div>
      </a-spin>
    </a-modal>

    <!-- 试播/试打弹窗(共享组件, 商户端端点注入) -->
    <DeviceTestDialog
      v-model:open="testOpen"
      :device-id="testDevice?.id ?? undefined"
      :device-no="testDevice?.deviceNo ?? undefined"
      :fetch-speech="fetchTestSpeech"
      :mode="testMode"
      :submit="submitTest"
      @sent="handleTestSent"
    />
  </div>
</template>

<style scoped>
  .qr-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 8px 0 4px;
  }

  .qr-tip {
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

  .qr-content {
    width: 100%;
    padding: 0 8px;
    color: var(--text-color-secondary);
    font-size: 12px;
    line-height: 1.5;
    text-align: center;
    word-break: break-all;
  }
</style>
