<script lang="ts" setup>
  import type { DeviceTestParam } from '@daxpay/ui-biz/components/device-test';
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { DeviceTestDialog } from '@daxpay/ui-biz/components/device-test';

  import { AudioDeviceApi, type AudioDeviceResult } from '#/api/payment/device/audio.api';
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
   * 行操作激活二维码(商户手机装 APP 后扫码即完成服务器配置与设备激活) / 试播试打。
   */
  defineOptions({ name: 'MchAudioDeviceList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();
  const route = useRoute();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 试播/试打弹窗(共享组件来自 ui-biz, 接口由本页注入商户端端点)
  const testOpen = ref(false);
  const testMode = ref<'announce' | 'print'>('announce');
  const testDevice = ref<AudioDeviceResult>();

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
      name: $t('payment.device.audio.field.deviceNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'appId',
      // 应用
      name: $t('payment.device.audio.field.appId'),
      placeholder: $t('common.pleaseSelect'),
      selectList: appOptions.value,
    },
    {
      type: 'list',
      field: 'storeNo',
      // 门店
      name: $t('payment.device.audio.field.storeNo'),
      placeholder: $t('common.pleaseSelect'),
      selectList: storeOptions.value,
    },
    {
      type: 'list',
      field: 'enable',
      // 状态
      name: $t('payment.device.audio.field.enable'),
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

  const tableData = ref<AudioDeviceResult[]>([]);

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
    AudioDeviceApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
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

  /** 设备展示名(确认弹窗等提示用) */
  function displayName(row: AudioDeviceResult): string {
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
  const configRow = ref<AudioDeviceResult>();
  const configForm = ref<ConfigFormState>({});
  // 打开时记录原归属, 保存时 diff 决定是否调用 bind 接口
  const originalAppId = ref<string>();
  const originalStoreNo = ref<string>();

  /**
   * 打开配置抽屉(拉取最新详情, 避免列表快照过期)
   */
  async function handleConfig(row: AudioDeviceResult) {
    configRow.value = row;
    configVisible.value = true;
    configLoading.value = true;
    try {
      const { data } = await AudioDeviceApi.get(row.id!);
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
        await AudioDeviceApi.bindApp({ id, appId });
      }
      // 门店归属变化: 空值走解绑(未分配, 不参与播报/打印)
      const storeNo = configForm.value.storeNo || undefined;
      if (storeNo !== originalStoreNo.value) {
        await (storeNo ? AudioDeviceApi.bindStore({ id, storeNo }) : AudioDeviceApi.unbindStore(id));
      }
      message.success($t('common.saveSuccess'));
      configVisible.value = false;
      queryPage();
    } finally {
      configSaving.value = false;
    }
  }

  // ===== 激活二维码弹窗 =====
  const qrVisible = ref(false);
  const qrLoading = ref(false);
  const qrContentStr = ref('');

  /**
   * 打开激活二维码弹窗(调 qr-content 拿内容字符串后本地渲染二维码)
   */
  function handleQrCode(row: AudioDeviceResult) {
    if (!row.deviceNo) {
      return;
    }
    qrLoading.value = true;
    qrVisible.value = true;
    qrContentStr.value = '';
    AudioDeviceApi.qrContent(row.deviceNo)
      .then((res) => {
        qrContentStr.value = res.data || '';
      })
      .finally(() => {
        qrLoading.value = false;
      });
  }

  /**
   * 复制激活二维码内容(供 APP 手工填入服务器地址+设备号兜底)
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
  function handleChangeEnable(row: AudioDeviceResult, enable: boolean) {
    confirm({
      // 启用/停用确认文案(带设备名)
      content: enable
        ? $t('payment.device.audio.confirmEnable', { name: displayName(row) })
        : $t('payment.device.audio.confirmDisable', { name: displayName(row) }),
      onOk() {
        return AudioDeviceApi.changeEnable(row.id!, enable).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 试播(可调金额与收款方式; 弹窗内含预计播报文案)
   */
  function handleTestBroadcast(row: AudioDeviceResult) {
    testDevice.value = row;
    testMode.value = 'announce';
    testOpen.value = true;
  }

  /**
   * 试打(内置版式渲染, 先预览后出纸由共享弹窗控制)
   */
  function handleTestPrint(row: AudioDeviceResult) {
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
    return AudioDeviceApi.testSpeech({ amountFen, channel }).then((res) => res.data ?? '');
  }

  /** 试播/试打下发(弹窗组好参后由本函数调对应端点) */
  function submitTest(param: DeviceTestParam): Promise<string> {
    const request =
      testMode.value === 'announce' ? AudioDeviceApi.testBroadcast(param) : AudioDeviceApi.testPrint(param);
    return request.then((res) => res.data ?? '');
  }

  /**
   * 操作列更多菜单(试播/试打/激活二维码/启停)
   */
  function getActionMenu(row: AudioDeviceResult): MenuProps {
    const items: MenuProps['items'] = [
      {
        key: 'testBroadcast',
        // 试播
        label: $t('payment.device.audio.action.testBroadcast'),
      },
      {
        key: 'testPrint',
        // 试打
        label: $t('payment.device.audio.action.testPrint'),
      },
      {
        key: 'qrCode',
        // 激活二维码
        label: $t('payment.device.audio.action.qrCode'),
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
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }"> </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column field="name" :title="$t('payment.device.audio.column.device')" :min-width="220">
            <template #default="{ row }">
              <div class="flex flex-col">
                <span>{{ row.name || '-' }}</span>
                <span class="text-xs text-muted-foreground">
                  {{ row.deviceNo || '-' }}
                </span>
              </div>
            </template>
          </vxe-column>
          <vxe-column field="appId" :title="$t('payment.device.audio.column.app')" :min-width="150">
            <template #default="{ row }">
              <span v-if="row.appId">{{ row.appName || row.appId }}</span>
              <!-- 空应用号表示全部应用 -->
              <span v-else class="text-muted-foreground">{{ $t('payment.device.audio.allApps') }}</span>
            </template>
          </vxe-column>
          <vxe-column field="storeNo" :title="$t('payment.device.audio.column.store')" :min-width="150">
            <template #default="{ row }">
              <span v-if="row.storeNo">{{ row.storeName || row.storeNo }}</span>
              <!-- 空门店表示未分配 -->
              <span v-else class="text-muted-foreground">{{ $t('payment.device.audio.unassigned') }}</span>
            </template>
          </vxe-column>
          <vxe-column field="enable" :title="$t('payment.device.audio.column.enable')" :min-width="90" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.enable" color="green">{{ $t('common.enable') }}</a-tag>
              <a-tag v-else color="default">{{ $t('common.disable') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 运行状态: 未激活优先(未激活无从判在线), 其次在线/离线(心跳 15 分钟窗口) -->
          <vxe-column
            field="online"
            :title="$t('payment.device.audio.column.runStatus')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <template v-if="row.vendor === 'virtual'">
                <a-tag v-if="row.activated === false" color="default">
                  {{ $t('payment.device.audio.runStatus.notActivated') }}
                </a-tag>
                <a-tag v-else-if="row.online" color="green">{{ $t('payment.device.audio.runStatus.online') }}</a-tag>
                <a-tag v-else color="red">{{ $t('payment.device.audio.runStatus.offline') }}</a-tag>
              </template>
              <span v-else style="color: var(--text-color-placeholder)">-</span>
            </template>
          </vxe-column>
          <vxe-column
            v-if="hasPermission(PermCodes.Device.Audio.MANAGE)"
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
                  {{ $t('payment.device.audio.action.config') }}
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
      :title="$t('payment.device.audio.config.title')"
      :default-size="600"
      resizable
      :destroy-on-hidden="true"
    >
      <a-spin :spinning="configLoading">
        <a-form layout="vertical" class="form-compact">
          <a-form-item :label="$t('payment.device.audio.column.device')">
            <span class="text-muted-foreground">
              {{ configRow?.name || '-' }}（{{ configRow?.deviceNo || '-' }}）
            </span>
          </a-form-item>
          <a-form-item :label="$t('payment.device.audio.column.app')">
            <a-select
              v-model:value="configForm.appId"
              :options="appOptions"
              :placeholder="$t('payment.device.audio.allApps')"
              allow-clear
              show-search
              option-filter-prop="label"
            />
            <!-- 留空表示全部应用 -->
            <div class="mt-1 text-xs text-muted-foreground">{{ $t('payment.device.audio.config.appHint') }}</div>
          </a-form-item>
          <a-form-item :label="$t('payment.device.audio.column.store')">
            <a-select
              v-model:value="configForm.storeNo"
              :options="storeOptions"
              :placeholder="$t('payment.device.audio.unassigned')"
              allow-clear
              show-search
              option-filter-prop="label"
            />
            <!-- 未分配门店将不参与播报/打印 -->
            <div class="mt-1 text-xs text-muted-foreground">{{ $t('payment.device.audio.config.storeHint') }}</div>
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

    <!-- 激活二维码弹窗: 商户手机装 APP 后扫码即完成服务器配置与设备激活 -->
    <a-modal
      v-model:open="qrVisible"
      :title="$t('payment.device.audio.qr.title')"
      :width="420"
      :footer="null"
      :destroy-on-hidden="true"
    >
      <a-spin :spinning="qrLoading">
        <div class="qr-modal">
          <p class="qr-tip">{{ $t('payment.device.audio.qr.tip') }}</p>
          <div v-if="qrContentStr" class="qr-card">
            <QrCode :value="qrContentStr" :width="250" :margin="0" />
          </div>
          <div class="qr-content">{{ qrContentStr || '-' }}</div>
          <a-button type="primary" block :disabled="!qrContentStr" @click="handleCopyQrContent">
            {{ $t('payment.device.audio.qr.copy') }}
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
