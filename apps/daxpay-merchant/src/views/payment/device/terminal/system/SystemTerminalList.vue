<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { NameNoCell } from '@daxpay/ui-biz/components/name-no-cell';

  import { TerminalDeviceApi, type TerminalDeviceResult } from '#/api/payment/device/terminal.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { MchStoreInfoApi } from '#/api/payment/merchant/store.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { normalizeRouteQueryValue } from '#/hooks/useRequiredRouteQuery';

  import SystemTerminalBindDrawer from './SystemTerminalBindDrawer.vue';
  import SystemTerminalEdit from './SystemTerminalEdit.vue';

  defineOptions({ name: 'SystemTerminalList' });

  const route = useRoute();

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 当前商户号（MerchantApi.get，不走 URL；新增终端时传入）
  const mchNo = ref('');

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const editRef = ref<InstanceType<typeof SystemTerminalEdit>>();
  const bindRef = ref<InstanceType<typeof SystemTerminalBindDrawer>>();

  const queryForm = ref<Record<string, any>>({});

  // 门店下拉(商户端由登录态隔离, 只需基础信息)
  const storeOptions = ref<{ label: string; value: string }[]>([]);

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'terminalNo',
      // 终端编码
      name: $t('payment.device.terminal.field.terminalNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'name',
      // 终端名称
      name: $t('payment.device.terminal.field.name'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'storeNo',
      // 门店
      name: $t('payment.device.terminal.field.store'),
      placeholder: $t('common.pleaseSelect'),
      selectList: storeOptions.value,
    },
    {
      type: 'list',
      field: 'enable',
      // 启用
      name: $t('payment.device.terminal.field.enable'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.device.terminal.enableYes'), value: true },
        { label: $t('payment.device.terminal.enableNo'), value: false },
      ],
    },
  ]);

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<TerminalDeviceResult[]>([]);

  /** 分页查询（后端强制当前商户） */
  function queryPage() {
    loading.value = true;
    TerminalDeviceApi.page({
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

  function handleAdd() {
    editRef.value?.showAdd(mchNo.value);
  }

  function handleEdit(row: TerminalDeviceResult) {
    editRef.value?.showEdit(row);
  }

  function handleBind(row: TerminalDeviceResult) {
    bindRef.value?.show(row);
  }

  /** 删除系统终端 */
  function handleDelete(row: TerminalDeviceResult) {
    confirm({
      // 确定删除该终端吗？
      content: $t('payment.device.terminal.confirmDelete'),
      onOk() {
        return TerminalDeviceApi.delete(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /** 加载当前商户号（新增终端时传入） */
  async function loadMerchantInfo() {
    const { data } = await MerchantApi.get();
    mchNo.value = data?.mchNo || '';
  }

  /** 加载门店下拉（门店筛选） */
  function loadStoreOptions() {
    MchStoreInfoApi.page({ current: 1, size: 200 }).then(({ data }) => {
      storeOptions.value = (data?.records || []).map((item) => ({
        label: item.storeName ? `${item.storeName} (${item.storeNo})` : item.storeNo!,
        value: item.storeNo!,
      }));
    });
  }

  /**
   * 操作列更多菜单（绑定管理只读查看已绑定通道终端, 删除危险操作置底）
   *
   * a-dropdown 的 menu prop 要求 MenuProps 对象(items+onClick), 传裸数组会因 menu.items
   * 为空导致弹出层渲染为空(点击无反应)——全站统一走 items+onClick 形态
   */
  function getActionMenu(row: TerminalDeviceResult): MenuProps {
    return {
      items: [
        {
          key: 'bind',
          // 绑定管理(只读查看通道终端绑定关系)
          label: $t('payment.device.terminal.bindManage'),
          disabled: !hasPermission(PermCodes.Merchant.Terminal.VIEW),
        },
        { type: 'divider' },
        {
          key: 'delete',
          // 删除
          label: $t('common.delete'),
          danger: true,
          disabled: !hasPermission(PermCodes.Merchant.Terminal.MANAGE),
        },
      ],
      onClick: ({ key }: { key: string }) => {
        if (key === 'bind') {
          handleBind(row);
          return;
        }
        if (key === 'delete') {
          handleDelete(row);
        }
      },
    };
  }

  onMounted(async () => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    // 门店工作台跳转入口带 storeNo 时预置筛选(本店终端过滤, 直达则展示当前商户全量)
    const presetStoreNo = normalizeRouteQueryValue(route.query.storeNo);
    if (presetStoreNo) {
      queryForm.value.storeNo = presetStoreNo;
    }
    loadStoreOptions();
    await loadMerchantInfo();
    queryPage();
  });
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
            <a-button v-if="hasPermission(PermCodes.Merchant.Terminal.MANAGE)" type="primary" @click="handleAdd">
              {{ $t('payment.device.terminal.add') }}
            </a-button>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column field="terminalNo" :title="$t('payment.device.terminal.field.terminalNo')" :min-width="200" />
          <vxe-column field="name" :title="$t('payment.device.terminal.field.name')" :min-width="140" />
          <vxe-column
            field="storeName"
            :title="$t('payment.device.terminal.field.store')"
            :min-width="200"
            :show-overflow="false"
          >
            <template #default="{ row }">
              <div v-if="row.storeNo" class="flex items-center gap-1">
                <!-- 门店名称(门店号)单行 -->
                <NameNoCell :name="row.storeName" :no="row.storeNo" />
                <!-- 门店默认终端标记(设置/取消默认入口在门店工作台) -->
                <a-tag v-if="row.defaultTerminal" color="processing" class="!m-0 !text-xs">
                  {{ $t('payment.device.terminal.defaultTag') }}
                </a-tag>
              </div>
              <span v-else style="color: var(--text-color-placeholder)">-</span>
            </template>
          </vxe-column>
          <vxe-column
            field="enable"
            :title="$t('payment.device.terminal.field.enable')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.enable" color="green">{{ $t('payment.device.terminal.enableYes') }}</a-tag>
              <a-tag v-else color="default">{{ $t('payment.device.terminal.enableNo') }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column
            field="remark"
            :title="$t('payment.device.terminal.field.remark')"
            :min-width="160"
            show-overflow
          />
          <vxe-column
            field="createTime"
            :title="$t('payment.device.terminal.field.createTime')"
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
                  v-if="hasPermission(PermCodes.Merchant.Terminal.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                >
                  {{ $t('common.edit') }}
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
        <div class="mt-3 flex justify-end">
          <vxe-pager
            v-model:current-page="pageConfig.currentPage"
            v-model:page-size="pageConfig.pageSize"
            :total="pageConfig.total"
            @page-change="handlePageChange"
          />
        </div>
      </a-card>
    </div>

    <SystemTerminalEdit ref="editRef" @ok="queryPage" />
    <SystemTerminalBindDrawer ref="bindRef" />
  </div>
</template>
