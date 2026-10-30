<script lang="ts" setup>
  import type { DeviceTestParam } from '@daxpay/ui-biz/components/device-test';
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type { VirtualDeviceResult } from '#/api/payment/device/virtual.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { DeviceTestDialog } from '@daxpay/ui-biz/components/device-test';

  import { VirtualDeviceApi } from '#/api/payment/device/virtual.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

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

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const generateRef = ref<InstanceType<typeof DeviceVirtualGenerateDrawer>>();
  const editRef = ref<InstanceType<typeof VirtualDeviceEditDrawer>>();
  const activationQrRef = ref<InstanceType<typeof ActivationQrModal>>();
  const bindMerchantRef = ref<InstanceType<typeof DeviceBindMerchantModal>>();

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

  /**
   * 打开生成抽屉(原子产号+入库)
   */
  function handleGenerate() {
    generateRef.value?.show();
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
   * 试播预计文案取数(运营端 test-speech 为纯预览端点, 不下发设备; 随参数防抖刷新)
   */
  function fetchTestSpeech(amountFen: number, channel: string): Promise<string> {
    return VirtualDeviceApi.testSpeech({ amountFen, channel }).then((res) => res.data ?? '');
  }

  /**
   * 试播/试打弹窗下发: 按模式适配端点
   * (试播走 test-speech 纯文案预览——运营端无下发试播端点; 试打走 test-print 真下发)
   */
  function submitTest(param: DeviceTestParam): Promise<string> {
    const request =
      testMode.value === 'announce'
        ? VirtualDeviceApi.testSpeech({ amountFen: param.amountFen, channel: param.channel })
        : VirtualDeviceApi.testPrint(param);
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
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
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

    <!-- 试播/试打弹窗(参数化: 金额/收款方式/输出模式/单号/版式; 试播为纯预览, 成功提示走预览口径) -->
    <DeviceTestDialog
      v-model:open="testOpen"
      announce-success-key="components.deviceTest.announcePreviewed"
      :device-id="testDevice?.id || undefined"
      :device-no="testDevice?.deviceNo ?? undefined"
      :fetch-speech="fetchTestSpeech"
      :mode="testMode"
      :submit="submitTest"
    />
  </div>
</template>
