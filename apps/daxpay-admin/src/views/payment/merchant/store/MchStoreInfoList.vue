<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type { Region } from '#/api/core/region.api';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ChinaRegionApi } from '#/api/core/region.api';
  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
  import { MchStoreInfoApi, type MchStoreInfoResult } from '#/api/payment/merchant/store.api';
  import { BQuery, type QueryField } from '#/components/query';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import MchStoreInfoEdit from './MchStoreInfoEdit.vue';

  defineOptions({ name: 'MchStoreInfoList' });

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
  // 商户信息（用于标题展示商户名称）
  const merchantInfo = ref<MerchantInfo>({});

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const storeEditRef = ref<InstanceType<typeof MchStoreInfoEdit>>();

  const queryForm = ref<Record<string, any>>({});

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'storeName',
      name: $t('payment.merchant.store.store.field.storeName'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'storeNo',
      name: $t('payment.merchant.store.store.field.storeNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'status',
      name: $t('payment.merchant.store.store.field.status'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.merchant.store.store.status.enable'), value: 'enable' },
        { label: $t('payment.merchant.store.store.status.disabled'), value: 'disabled' },
      ],
    },
  ]);

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<MchStoreInfoResult[]>([]);

  // 行政区划 code -> name 映射, 用于列表反查省市区
  const regionMap = ref<Map<string, string>>(new Map());

  /**
   * 递归展平区划树为 code -> name 映射
   */
  function flattenRegion(list: Region[], map: Map<string, string>) {
    for (const r of list) {
      map.set(r.code, r.name);
      if (r.children?.length) {
        flattenRegion(r.children, map);
      }
    }
  }

  /**
   * 加载行政区划数据构建映射
   */
  async function loadRegionMap() {
    const { data } = await ChinaRegionApi.findAllProvinceAndCityAndArea();
    const map = new Map<string, string>();
    flattenRegion(data, map);
    regionMap.value = map;
  }

  /**
   * 根据区划代码还原省市区文本(6位代码包含省2/市4/区6层级)
   */
  function regionCodeToText(code?: string): string {
    if (!code || code.length < 2) return '';
    const parts: string[] = [];
    if (code.length >= 2) parts.push(regionMap.value.get(code.slice(0, 2)) || '');
    if (code.length >= 4) parts.push(regionMap.value.get(code.slice(0, 4)) || '');
    if (code.length >= 6) parts.push(regionMap.value.get(code.slice(0, 6)) || '');
    return parts.filter(Boolean).join('');
  }

  /**
   * 拼接完整地址(省市区 + 详细地址)
   */
  function fullAddress(row: MchStoreInfoResult): string {
    return regionCodeToText(row.regionCode) + (row.address || '');
  }

  /**
   * 分页查询门店列表
   */
  function queryPage() {
    if (!mchNo.value) {
      loading.value = false;
      return;
    }
    loading.value = true;
    MchStoreInfoApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      mchNo: mchNo.value,
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
    return Promise.resolve();
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
    if (!routeContext.isValid.value) {
      return;
    }
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    // 国际化：加载行政区划映射用于地址反查
    loadRegionMap();
    // 加载商户信息用于标题展示
    loadMerchantInfo();
    queryPage();
  });

  /**
   * 返回商户工作台
   */
  function handleBack() {
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
      }
    });
  }

  function handleAdd() {
    storeEditRef.value?.show(mchNo.value!);
  }

  function handleEdit(row: MchStoreInfoResult) {
    storeEditRef.value?.showEdit(mchNo.value!, row);
  }

  /**
   * 查看门店
   */
  function handleView(row: MchStoreInfoResult) {
    storeEditRef.value?.showView(mchNo.value!, row);
  }

  /**
   * 删除门店
   */
  function handleDelete(row: MchStoreInfoResult) {
    confirm({
      content: $t('payment.merchant.store.store.confirmDelete'),
      onOk() {
        return MchStoreInfoApi.delete(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
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
        <div class="flex items-center gap-2">
          <!-- 国际化：门店管理 -->
          <a-button
            type="text"
            class="flex items-center justify-center rounded-full hover:bg-accent"
            @click="handleBack"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
            </template>
          </a-button>
          <span class="text-lg font-bold text-foreground">{{ $t('payment.merchant.store.store.title') }}</span>
          <span v-if="merchantInfo.mchName" class="text-sm text-muted-foreground">({{ merchantInfo.mchName }})</span>
        </div>
      </template>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <a-button v-if="hasPermission(PermCodes.Merchant.Store.MANAGE)" type="primary" @click="handleAdd">{{
                $t('common.add')
              }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column field="storeNo" :title="$t('payment.merchant.store.store.field.storeNo')" :min-width="180">
            <template #default="{ row }">
              <a
                v-if="hasPermission(PermCodes.Merchant.Store.VIEW)"
                href="javascript:"
                class="vben-link"
                @click="handleView(row)"
                >{{ row.storeNo }}</a
              >
              <span v-else>{{ row.storeNo }}</span>
            </template>
          </vxe-column>
          <vxe-column field="storeName" :title="$t('payment.merchant.store.store.field.storeName')" :min-width="160" />
          <vxe-column
            field="contactPhone"
            :title="$t('payment.merchant.store.store.field.contactPhone')"
            :min-width="130"
          />
          <vxe-column field="address" :title="$t('payment.merchant.store.store.field.address')" :min-width="240">
            <template #default="{ row }">
              <span>{{ fullAddress(row) }}</span>
            </template>
          </vxe-column>
          <vxe-column
            field="status"
            :title="$t('payment.merchant.store.store.field.status')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.status === 'enable'" color="green">{{
                $t('payment.merchant.store.store.status.enable')
              }}</a-tag>
              <a-tag v-else color="red">{{ $t('payment.merchant.store.store.status.disabled') }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column
            field="createTime"
            :title="$t('payment.merchant.store.store.field.createTime')"
            :min-width="180"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" width="140" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.Merchant.Store.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                  >{{ $t('common.edit') }}</a-button
                >
                <a-button
                  v-if="hasPermission(PermCodes.Merchant.Store.MANAGE)"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(row)"
                  >{{ $t('common.delete') }}</a-button
                >
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

    <MchStoreInfoEdit ref="storeEditRef" @ok="queryPage" />
  </div>
</template>
