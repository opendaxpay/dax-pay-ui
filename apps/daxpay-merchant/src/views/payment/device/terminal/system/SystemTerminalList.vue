<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { TerminalDeviceApi, type TerminalDeviceResult } from '#/api/payment/device/terminal.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import SystemTerminalBindDrawer from './SystemTerminalBindDrawer.vue';
  import SystemTerminalEdit from './SystemTerminalEdit.vue';

  defineOptions({ name: 'SystemTerminalList' });

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
      type: 'string',
      field: 'storeNo',
      // 门店号
      name: $t('payment.device.terminal.field.storeNo'),
      placeholder: $t('common.pleaseInput'),
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

  onMounted(async () => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
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
          <vxe-column field="storeName" :title="$t('payment.device.terminal.field.store')" :min-width="160">
            <template #default="{ row }">
              <div v-if="row.storeNo" class="flex flex-col">
                <span>{{ row.storeName || '-' }}</span>
                <span class="text-xs text-muted-foreground">{{ row.storeNo }}</span>
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
            field="createTime"
            :title="$t('payment.device.terminal.field.createTime')"
            :min-width="180"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" width="220" :show-overflow="false" :title="$t('common.operation')">
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
                <a-button
                  v-if="hasPermission(PermCodes.Merchant.Terminal.VIEW)"
                  type="link"
                  size="small"
                  @click="handleBind(row)"
                >
                  {{ $t('payment.device.terminal.bindManage') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.Merchant.Terminal.MANAGE)"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(row)"
                >
                  {{ $t('common.delete') }}
                </a-button>
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
