<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { PageTitleBar } from '@daxpay/ui-biz/components/page-title-bar';
  import { useDynamicTabTitle } from '@daxpay/ui-biz/hooks/useDynamicTabTitle';

  import { TerminalDeviceApi, type TerminalDeviceResult } from '#/api/payment/device/terminal.api';
  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
  import { BQuery, type QueryField } from '#/components/query';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import TerminalChannelDrawer from '../components/TerminalChannelDrawer.vue';
  import SystemTerminalEdit from './SystemTerminalEdit.vue';

  defineOptions({ name: 'SystemTerminalList' });

  const route = useRoute();
  const router = useRouter();

  // 商户号从路由 query 获取
  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const mchNo = computed(() => routeContext.query.value.mchNo);
  // 是否由门店工作台跳入(回退时原路返回门店工作台, 其余回商户工作台)
  const fromStore = computed(() => normalizeRouteQueryValue(route.query.from) === 'store');
  const { setTabObjectTitle } = useDynamicTabTitle($t('payment.device.terminal.systemTitle'));
  // 商户信息（用于标题展示商户名称）
  const merchantInfo = ref<MerchantInfo>({});

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const editRef = ref<InstanceType<typeof SystemTerminalEdit>>();
  const bindRef = ref<InstanceType<typeof TerminalChannelDrawer>>();

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

  /**
   * 分页查询
   */
  function queryPage() {
    if (!mchNo.value) {
      loading.value = false;
      return;
    }
    loading.value = true;
    TerminalDeviceApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      mchNo: mchNo.value,
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
    editRef.value?.showAdd(mchNo.value!);
  }

  function handleEdit(row: TerminalDeviceResult) {
    editRef.value?.showEdit(row);
  }

  function handleBind(row: TerminalDeviceResult) {
    bindRef.value?.show({ name: row.name, terminalNo: row.terminalNo || '' });
  }

  /**
   * 删除系统终端
   */
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

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    // 门店工作台跳转入口带 storeNo 时预置筛选(本店终端过滤, 直达则展示该商户全量)
    const presetStoreNo = normalizeRouteQueryValue(route.query.storeNo);
    if (presetStoreNo) {
      queryForm.value.storeNo = presetStoreNo;
    }
    // 加载商户信息用于标题展示
    loadMerchantInfo();
    queryPage();
  });

  /**
   * 返回上级工作台(门店工作台进入时回门店工作台, 其余回商户工作台)
   */
  function handleBack() {
    // 门店工作台入口携带 from=store + 门店 id/storeNo, 原路返回
    if (fromStore.value) {
      router.push({
        path: '/payment/merchant/store/workbench',
        query: {
          id: String(route.query.id ?? ''),
          storeNo: String(route.query.storeNo ?? ''),
          mchNo: mchNo.value,
        },
      });
      return;
    }
    router.push({
      path: '/payment/merchant/manage',
      query: { mchNo: mchNo.value },
    });
  }

  /**
   * 加载商户信息
   */
  function loadMerchantInfo() {
    if (!mchNo.value) return;
    MerchantApi.findByMchNo(mchNo.value).then(({ data }) => {
      if (data) {
        merchantInfo.value = data;
        // 页签标题动态化为「{商户名} · 商户终端」(与菜单 i18n_key 及页头保持同一口径)
        setTabObjectTitle(data.mchName || '');
      }
    });
  }
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingMchNo')"
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <template #title>
        <!-- 运营视角统一为「商户终端」, 与菜单/页签同口径; 门店维度仍称「系统终端」 -->
        <PageTitleBar
          back
          :title="$t('payment.device.terminal.systemTitle')"
          :name="merchantInfo.mchName || ''"
          @back="handleBack"
        />
      </template>
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
    <TerminalChannelDrawer ref="bindRef" />
  </div>
</template>
