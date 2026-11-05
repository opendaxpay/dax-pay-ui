<script lang="ts" setup>
  import type { DeviceTestParam } from '@daxpay/ui-biz/components/device-test';
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type { VirtualDeviceResult } from '#/api/payment/device/virtual.api';

  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { DeviceTestDialog } from '@daxpay/ui-biz/components/device-test';

  import { VirtualDeviceApi } from '#/api/payment/device/virtual.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { normalizeRouteQueryValue } from '#/hooks/useRequiredRouteQuery';

  import ActivationQrModal from './components/ActivationQrModal.vue';
  import DeviceBindMerchantModal from './DeviceBindMerchantModal.vue';
  import DeviceVirtualGenerateDrawer from './DeviceVirtualGenerateDrawer.vue';
  import VirtualDeviceEditDrawer from './VirtualDeviceEditDrawer.vue';

  /**
   * 虚拟设备管理(简版, 手机 APP 变云音箱/云打印)
   *
   * 生命周期入口: 生成(原子产号+入库) + 归属维护(绑定/解绑商户) + 编辑(名称/启停)
   * + 激活二维码(扫码完成服务器配置+设备绑定) + 试播/试打端到端验证;
   * 裁剪: 无代理商分拨/收回、无 CSV 导出、无监控、无激活日志、无只读详情抽屉。
   * 删除守卫: 未激活且未绑定才可删(后端校验)。
   */
  defineOptions({ name: 'VirtualDeviceList' });

  const route = useRoute();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  // 导出中标记(服务端为内存生成, 期间禁用按钮防重复提交)
  const exporting = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const generateRef = ref<InstanceType<typeof DeviceVirtualGenerateDrawer>>();
  const editRef = ref<InstanceType<typeof VirtualDeviceEditDrawer>>();
  const activationQrRef = ref<InstanceType<typeof ActivationQrModal>>();
  const bindMerchantRef = ref<InstanceType<typeof DeviceBindMerchantModal>>();

  // 勾选行(仅当前页, 查询/翻页后清空)
  const selectedRows = ref<VirtualDeviceResult[]>([]);

  // 试播/试打弹窗状态(金额/渠道/输出模式参数化)
  const testOpen = ref(false);
  const testMode = ref<'announce' | 'print'>('announce');
  const testDevice = ref<VirtualDeviceResult>();

  const queryForm = ref<Record<string, any>>({});

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'deviceNo',
      // 设备号
      name: $t('payment.device.virtual.field.deviceNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'batchNo',
      // 批次号
      name: $t('payment.device.virtual.field.batchNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'mchNo',
      // 商户号
      name: $t('payment.device.virtual.field.mchNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'storeNo',
      // 门店号
      name: $t('payment.device.virtual.field.storeNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'enable',
      // 状态
      name: $t('payment.device.virtual.field.enable'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.device.virtual.enabled'), value: 'true' },
        { label: $t('payment.device.virtual.disabled'), value: 'false' },
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
   * 同步勾选行
   */
  function handleCheckboxChange() {
    selectedRows.value = (xTable.value?.getCheckboxRecords() || []) as VirtualDeviceResult[];
  }

  /**
   * 分页查询虚拟设备
   */
  function queryPage() {
    loading.value = true;
    VirtualDeviceApi.page({
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
    // 商户工作台/门店工作台跳转入口带 mchNo/storeNo 时预置筛选(直达菜单访问则不带, 展示全量)
    const presetMchNo = normalizeRouteQueryValue(route.query.mchNo);
    if (presetMchNo) {
      queryForm.value.mchNo = presetMchNo;
    }
    const presetStoreNo = normalizeRouteQueryValue(route.query.storeNo);
    if (presetStoreNo) {
      queryForm.value.storeNo = presetStoreNo;
    }
    queryPage();
  });

  /**
   * 打开生成抽屉(原子产号+入库)
   */
  function handleGenerate() {
    generateRef.value?.show();
  }

  /**
   * 导出当前查询条件下的虚拟设备清单(时间列由后端按当前用户时区格式化)
   */
  async function handleExport() {
    exporting.value = true;
    // 失败提示已由 downloadExportFile 统一弹出, 此处只复位按钮状态
    await VirtualDeviceApi.exportExcel(queryForm.value, {
      fileName: `${$t('payment.device.virtual.exportFileName')}.xlsx`,
      failedText: $t('payment.device.virtual.exportFailed'),
    }).finally(() => {
      exporting.value = false;
    });
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
   * 批量绑定商户(商户+应用+门店三件套, 弹窗已支持 ids 数组)
   */
  function handleBatchBindMerchant() {
    const ids = getSelectedIds();
    if (!ids) {
      return;
    }
    bindMerchantRef.value?.show(ids);
  }

  /**
   * 批量解绑商户(凭证重置, 设备端需重新激活; 危险操作二次确认)
   */
  function handleBatchUnbindMerchant() {
    const ids = getSelectedIds();
    if (!ids) {
      return;
    }
    confirm({
      content: $t('payment.device.virtual.confirmBatchUnbind', { count: ids.length }),
      onOk() {
        return VirtualDeviceApi.unbindMerchant(ids).then(() => {
          message.success($t('payment.device.virtual.batchUnbindSuccess', { count: ids.length }));
          queryPage();
        });
      },
    });
  }

  /**
   * 工具栏批量操作菜单(绑定/解绑商户)
   *
   * a-dropdown 的 menu prop 要求 MenuProps 对象(items+onClick), 传裸数组会因 menu.items
   * 为空导致弹出层渲染为空(点击无反应)——全站统一走 items+onClick 形态
   */
  function getBatchActionMenu(): MenuProps {
    return {
      items: [
        { key: 'batchBindMerchant', label: $t('payment.device.virtual.batchBindMerchant') },
        { key: 'batchUnbindMerchant', label: $t('payment.device.virtual.batchUnbindMerchant'), danger: true },
      ],
      onClick: ({ key }: { key: string }) => {
        if (key === 'batchBindMerchant') {
          handleBatchBindMerchant();
        } else if (key === 'batchUnbindMerchant') {
          handleBatchUnbindMerchant();
        }
      },
    };
  }

  /**
   * 绑定商户(商户+应用+门店三件套)
   */
  function handleBindMerchant(row: VirtualDeviceResult) {
    bindMerchantRef.value?.show([row.id!]);
  }

  /**
   * 解绑商户(凭证重置, 设备端需重新激活)
   */
  function handleUnbindMerchant(row: VirtualDeviceResult) {
    confirm({
      content: $t('payment.device.virtual.confirmUnbind'),
      onOk() {
        return VirtualDeviceApi.unbindMerchant([row.id!]).then(() => {
          message.success($t('payment.device.virtual.unbindSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 启停切换(列表开关直切)
   */
  function handleEnable(row: VirtualDeviceResult, enable: boolean) {
    VirtualDeviceApi.changeEnable(row.id!, enable).then(() => {
      message.success(
        enable ? $t('payment.device.virtual.enableSuccess') : $t('payment.device.virtual.disableSuccess'),
      );
      row.enable = enable;
    });
  }

  /**
   * 打开编辑抽屉(名称/启停)
   */
  function handleEdit(row: VirtualDeviceResult) {
    editRef.value?.show(row);
  }

  /**
   * 删除(未激活且未绑定才可删, 后端守卫; 危险操作二次确认)
   */
  function handleDelete(row: VirtualDeviceResult) {
    confirm({
      content: $t('payment.device.virtual.confirmDelete'),
      onOk() {
        return VirtualDeviceApi.delete(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 打开激活二维码弹窗(扫码即完成服务器配置+设备绑定)
   */
  function handleShowQr(row: VirtualDeviceResult) {
    activationQrRef.value?.show(row);
  }

  /**
   * 试播(可调金额与收款方式, 弹窗内看预计播报文案)
   */
  function handleTest(row: VirtualDeviceResult) {
    testDevice.value = row;
    testMode.value = 'announce';
    testOpen.value = true;
  }

  /**
   * 试打(可选金额/收款方式/输出模式/单号/版式)
   */
  function handleTestPrint(row: VirtualDeviceResult) {
    testDevice.value = row;
    testMode.value = 'print';
    testOpen.value = true;
  }

  /**
   * 试播预计文案取数(仅弹窗内展示「预计播报」, 不下发设备; 随参数防抖刷新)
   */
  function fetchTestSpeech(amountFen: number, channel: string): Promise<string> {
    return VirtualDeviceApi.testSpeech({ amountFen, channel }).then((res) => res.data ?? '');
  }

  /**
   * 试播/试打弹窗下发: 按模式适配端点
   * (试播走 test 真下发 audio.test, 试打走 test-print 真下发)
   */
  function submitTest(param: DeviceTestParam): Promise<string> {
    const request = testMode.value === 'announce' ? VirtualDeviceApi.test(param) : VirtualDeviceApi.testPrint(param);
    return request.then((res) => res.data ?? '');
  }

  /**
   * 行内更多菜单(调试/出码/归属/删除; 危险操作置底)
   *
   * a-dropdown 的 menu prop 要求 MenuProps 对象(items+onClick), 传裸数组会因 menu.items
   * 为空导致弹出层渲染为空(点击无反应)——全站统一走 items+onClick 形态
   */
  function getActionMenu(row: VirtualDeviceResult): MenuProps {
    const items: any[] = [
      // 未激活设备无法接收指令
      { key: 'test', label: $t('payment.device.virtual.actionTest'), disabled: !row.activated },
      { key: 'testPrint', label: $t('payment.device.virtual.actionTestPrint'), disabled: !row.activated },
      { key: 'qr', label: $t('payment.device.virtual.actionQr') },
      { type: 'divider' as const, key: 'd1' },
    ];
    if (row.mchNo) {
      items.push({ key: 'unbind', label: $t('payment.device.virtual.actionUnbind'), danger: true });
    } else {
      items.push({ key: 'bind', label: $t('payment.device.virtual.actionBind') });
    }
    items.push({ type: 'divider' as const, key: 'd2' }, { key: 'delete', label: $t('common.delete'), danger: true });
    return {
      items,
      onClick: ({ key }: any) => handleActionMenu({ key }, row),
    };
  }

  /**
   * 行内更多菜单点击分发
   */
  function handleActionMenu(info: { key: number | string }, row: VirtualDeviceResult) {
    switch (info.key) {
      case 'bind': {
        handleBindMerchant(row);
        break;
      }
      case 'delete': {
        handleDelete(row);
        break;
      }
      case 'qr': {
        handleShowQr(row);
        break;
      }
      case 'test': {
        handleTest(row);
        break;
      }
      case 'testPrint': {
        handleTestPrint(row);
        break;
      }
      case 'unbind': {
        handleUnbindMerchant(row);
        break;
      }
    }
  }
</script>

<template>
  <div class="list-page-compact m-3 rounded-lg bg-background p-3">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <a-button v-if="hasPermission(PermCodes.Device.Virtual.MANAGE)" type="primary" @click="handleGenerate">
                {{ $t('payment.device.virtual.generate.title') }}
              </a-button>
              <!-- 批量操作: 绑定/解绑商户(无权限或无勾选时禁用) -->
              <a-dropdown
                :disabled="!hasPermission(PermCodes.Device.Virtual.MANAGE) || selectedRows.length === 0"
                :menu="getBatchActionMenu()"
              >
                <a-button :disabled="!hasPermission(PermCodes.Device.Virtual.MANAGE) || selectedRows.length === 0">
                  {{ $t('payment.device.virtual.batchActions') }}
                  <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                </a-button>
              </a-dropdown>
              <a-button
                v-if="hasPermission(PermCodes.Device.Virtual.EXPORT)"
                :loading="exporting"
                @click="handleExport"
              >
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
          <!-- 设备号(平台自造 SN) -->
          <vxe-column field="deviceNo" :title="$t('payment.device.virtual.field.deviceNo')" :min-width="180">
            <template #default="{ row }">
              <span class="font-mono">{{ row.deviceNo || '-' }}</span>
            </template>
          </vxe-column>
          <vxe-column field="name" :title="$t('payment.device.virtual.field.name')" :min-width="140">
            <template #default="{ row }">
              <span v-if="row.name">{{ row.name }}</span>
              <span v-else style="color: var(--text-color-placeholder)">-</span>
            </template>
          </vxe-column>
          <vxe-column field="batchNo" :title="$t('payment.device.virtual.field.batchNo')" :min-width="140">
            <template #default="{ row }">
              <span v-if="row.batchNo">{{ row.batchNo }}</span>
              <span v-else style="color: var(--text-color-placeholder)">-</span>
            </template>
          </vxe-column>
          <!-- 归属: 已绑商户显商户名 > 平台库存 -->
          <vxe-column :title="$t('payment.device.virtual.owner')" :min-width="160">
            <template #default="{ row }">
              <span v-if="row.mchNo">{{ row.mchName || row.mchNo }}</span>
              <a-tag v-else color="default">{{ $t('payment.device.virtual.platformStock') }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column
            field="activated"
            :title="$t('payment.device.virtual.activateStatus')"
            :min-width="90"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.activated" color="green">{{ $t('payment.device.virtual.activated') }}</a-tag>
              <a-tag v-else color="default">{{ $t('payment.device.virtual.notActivated') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 运行状态: 未激活无从判在线, 其次在线/离线 -->
          <vxe-column field="online" :title="$t('payment.device.virtual.runStatus')" :min-width="90" align="center">
            <template #default="{ row }">
              <span v-if="!row.activated" style="color: var(--text-color-placeholder)">-</span>
              <a-tag v-else-if="row.online" color="green">{{ $t('payment.device.virtual.online') }}</a-tag>
              <a-tag v-else color="red">{{ $t('payment.device.virtual.offline') }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column
            v-if="hasPermission(PermCodes.Device.Virtual.MANAGE)"
            field="enable"
            :title="$t('payment.device.virtual.enableTitle')"
            :min-width="70"
            align="center"
          >
            <template #default="{ row }">
              <a-switch :checked="row.enable" size="small" @change="(v: any) => handleEnable(row, !!v)" />
            </template>
          </vxe-column>
          <!-- 最后在线时间(心跳节流落库, 非实时值) -->
          <vxe-column
            field="lastOnlineTime"
            :title="$t('payment.device.virtual.lastOnline')"
            :min-width="180"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" :width="160" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.Device.Virtual.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                >
                  {{ $t('common.edit') }}
                </a-button>
                <a-dropdown v-if="hasPermission(PermCodes.Device.Virtual.MANAGE)" :menu="getActionMenu(row)">
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

    <DeviceVirtualGenerateDrawer ref="generateRef" @ok="queryPage" />

    <VirtualDeviceEditDrawer ref="editRef" @ok="queryPage" />

    <!-- 绑定商户弹窗(传虚拟设备 API) -->
    <DeviceBindMerchantModal ref="bindMerchantRef" :api="VirtualDeviceApi" @ok="queryPage" />

    <!-- 激活二维码弹窗(扫码完成服务器配置+设备绑定) -->
    <ActivationQrModal ref="activationQrRef" />

    <!-- 试播/试打弹窗(参数化: 金额/收款方式/输出模式/单号/版式; 试播为真下发, 弹窗内另附预计播报文案) -->
    <DeviceTestDialog
      v-model:open="testOpen"
      :device-id="testDevice?.id || undefined"
      :device-no="testDevice?.deviceNo ?? undefined"
      :fetch-speech="fetchTestSpeech"
      :mode="testMode"
      :submit="submitTest"
    />
  </div>
</template>
