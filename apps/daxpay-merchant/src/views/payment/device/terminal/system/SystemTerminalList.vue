<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';

  import { $t } from '@vben/locales';

  import { TerminalDeviceApi, type TerminalDeviceResult } from '#/api/payment/device/terminal.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { MchStoreInfoApi } from '#/api/payment/merchant/store.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { normalizeRouteQueryValue } from '#/hooks/useRequiredRouteQuery';

  import TerminalChannelDrawer from '../components/TerminalChannelDrawer.vue';
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
  const channelRef = ref<InstanceType<typeof TerminalChannelDrawer>>();

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

  /** 打开「关联终端」抽屉(只读查看该商户终端关联的通道终端) */
  function handleBind(row: TerminalDeviceResult) {
    channelRef.value?.show({ terminalNo: row.terminalNo || '', name: row.name });
  }

  /**
   * 关联通道摘要分段: N 条 · 已报备 X · 异常 Y
   *
   * 返回分段数组便于模板逐段渲染, 异常段单独标红(异常数为 0 时不标红)
   */
  function channelSummary(row: TerminalDeviceResult) {
    const list = row.channelTerminals || [];
    return [
      {
        key: 'total',
        // 共 N 条
        text: $t('payment.device.terminal.summaryTotal', { count: list.length }),
        error: false,
      },
      {
        key: 'submitted',
        // 已报备 N
        text: $t('payment.device.terminal.summarySubmitted', {
          count: list.filter((item) => item.status === 'submit').length,
        }),
        error: false,
      },
      {
        key: 'error',
        // 异常 N
        text: $t('payment.device.terminal.summaryError', {
          count: list.filter((item) => item.status === 'error').length,
        }),
        error: list.some((item) => item.status === 'error'),
      },
    ];
  }

  /** 删除商户终端 */
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
          <vxe-column field="storeName" :title="$t('payment.device.terminal.field.store')" :min-width="150">
            <template #default="{ row }">
              <div v-if="row.storeNo" class="flex min-w-0 items-center gap-1">
                <!-- 门店名称单行省略(与 plus 终端列表口径一致: 只展示名称不拼门店号, 门店号仅作筛选条件) -->
                <span class="min-w-0 truncate" :title="row.storeName || row.storeNo">
                  {{ row.storeName || row.storeNo }}
                </span>
                <!-- 门店默认终端标记(设置/取消默认入口在门店工作台) -->
                <a-tag v-if="row.defaultTerminal" color="processing" class="!m-0 shrink-0 !text-xs">
                  {{ $t('payment.device.terminal.defaultTag') }}
                </a-tag>
              </div>
              <span v-else style="color: var(--text-color-placeholder)">-</span>
            </template>
          </vxe-column>
          <vxe-column
            field="channelTerminals"
            :title="$t('payment.device.terminal.field.relatedChannel')"
            :min-width="190"
            show-overflow
          >
            <template #default="{ row }">
              <template v-if="Array.isArray(row.channelTerminals)">
                <!-- 后端已下发: 空数组=未绑定, 非空=条数/已报备/异常摘要 -->
                <span v-if="row.channelTerminals.length === 0" style="color: var(--text-color-placeholder)">
                  {{ $t('payment.device.terminal.notBound') }}
                </span>
                <span v-else>
                  <template v-for="(item, index) in channelSummary(row)" :key="item.key">
                    <span v-if="index > 0"> · </span>
                    <span :class="item.error ? 'text-red-500' : ''">{{ item.text }}</span>
                  </template>
                </span>
              </template>
              <!-- 后端未下发 channelTerminals 时降级为「查看」入口, 不误显示未绑定 -->
              <a-button
                v-else-if="hasPermission(PermCodes.Merchant.Terminal.VIEW)"
                type="link"
                size="small"
                @click="handleBind(row)"
              >
                {{ $t('common.view') }}
              </a-button>
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
          <vxe-column fixed="right" :width="260" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <!-- 关联终端: 只读查看该商户终端已关联的通道终端 -->
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
                  @click="handleEdit(row)"
                >
                  {{ $t('common.edit') }}
                </a-button>
                <!-- 删除: 危险操作红色, 与关联终端/编辑平铺直出 -->
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
    <TerminalChannelDrawer ref="channelRef" />
  </div>
</template>
