<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type { Region } from '#/api/core/region.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ChinaRegionApi } from '#/api/core/region.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { MchStoreInfoApi, type MchStoreInfoResult } from '#/api/payment/merchant/store.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import MchStoreInfoEdit from './MchStoreInfoEdit.vue';

  defineOptions({ name: 'MchStoreInfoList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 当前商户号（MerchantApi.get，不走 URL）
  const mchNo = ref('');

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const storeEditRef = ref<InstanceType<typeof MchStoreInfoEdit>>();

  const queryForm = ref<Record<string, any>>({});

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'storeName',
      // 门店名称
      name: $t('payment.merchant.store.store.field.storeName'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'storeNo',
      // 门店号
      name: $t('payment.merchant.store.store.field.storeNo'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'status',
      // 状态
      name: $t('payment.merchant.store.store.field.status'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        // 启用
        { label: $t('payment.merchant.store.store.status.enable'), value: 'enable' },
        // 停用
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

  // 是否有门店但没有默认门店(用于告警横幅)
  const hasStoreWithoutDefault = computed(() => {
    return tableData.value.length > 0 && !tableData.value.some((s) => s.defaultStore);
  });

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
   *
   * 门店 page 靠 query.mchNo 过滤（不像 list 会从上下文取），商户端必须传入当前 mchNo。
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
      .then((res) => {
        tableData.value = res.data?.records || [];
        pageConfig.value.total = Number(res.data?.total) || 0;
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

  onMounted(async () => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    loadRegionMap();
    const { data } = await MerchantApi.get();
    mchNo.value = data?.mchNo || '';
    if (!mchNo.value) {
      message.error($t('common.loadFailed'));
      return;
    }
    queryPage();
  });

  function handleAdd() {
    storeEditRef.value?.show(mchNo.value);
  }

  function handleEdit(row: MchStoreInfoResult) {
    storeEditRef.value?.showEdit(mchNo.value, row);
  }

  /**
   * 查看门店
   */
  function handleView(row: MchStoreInfoResult) {
    storeEditRef.value?.showView(mchNo.value, row);
  }

  /**
   * 删除门店
   *
   * 默认门店禁止删除(与 MchStoreInfoService.delete 后端校验对齐),
   * 需先把其他门店设为默认, 再删除当前门店。
   */
  function handleDelete(row: MchStoreInfoResult) {
    if (row.defaultStore) {
      message.warning($t('payment.merchant.store.store.deleteDefaultBlocked'));
      return;
    }
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

  /**
   * 设为默认门店
   */
  function handleSetDefault(row: MchStoreInfoResult) {
    confirm({
      content: $t('payment.merchant.store.store.confirmSetDefault'),
      onOk() {
        return MchStoreInfoApi.setDefault(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 取消默认门店
   */
  function handleClearDefault(row: MchStoreInfoResult) {
    confirm({
      content: $t('payment.merchant.store.store.confirmClearDefault'),
      onOk() {
        return MchStoreInfoApi.clearDefault(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 操作列更多菜单（第 3 个起收入更多）
   */
  function getActionMenu(row: MchStoreInfoResult): MenuProps {
    const items: MenuProps['items'] = [];
    if (hasPermission(PermCodes.Merchant.Store.MANAGE)) {
      if (!row.defaultStore) {
        items.push({
          key: 'setDefault',
          // 设为默认
          label: $t('payment.merchant.store.store.setDefault'),
        });
      } else {
        items.push({
          key: 'clearDefault',
          // 取消默认
          label: $t('payment.merchant.store.store.clearDefault'),
        });
      }
      items.push({ type: 'divider' });
      items.push({
        key: 'delete',
        // 删除
        label: $t('common.delete'),
        danger: true,
      });
    }
    return {
      items,
      onClick: ({ key }: { key: string }) => {
        switch (key) {
          case 'clearDefault': {
            handleClearDefault(row);
            break;
          }
          case 'delete': {
            handleDelete(row);
            break;
          }
          case 'setDefault': {
            handleSetDefault(row);
            break;
          }
        }
      },
    };
  }
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <template #title>
        <!-- 门店管理（与菜单 menu.payment.merchant.store 一致） -->
        <span class="text-lg font-bold text-foreground">{{ $t('menu.payment.merchant.store') }}</span>
      </template>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <!-- 有门店但未设置默认门店时提示（margin 放 wrapper，避免 antd 覆盖 Tailwind） -->
    <div v-if="hasStoreWithoutDefault && !loading" class="mt-4">
      <a-alert :message="$t('payment.merchant.store.store.noDefaultStoreTip')" type="warning" show-icon />
    </div>

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
          <vxe-column field="storeName" :title="$t('payment.merchant.store.store.field.storeName')" :min-width="160">
            <template #default="{ row }">
              <span>{{ row.storeName }}</span>
            </template>
          </vxe-column>
          <!-- 默认门店: 独立成列, 不与名称挤在一起 -->
          <vxe-column
            field="defaultStore"
            :title="$t('payment.merchant.store.store.defaultStore')"
            :width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.defaultStore" color="processing">{{ $t('common.yes') }}</a-tag>
              <span v-else class="text-muted-foreground">{{ $t('common.no') }}</span>
            </template>
          </vxe-column>
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
          <vxe-column fixed="right" width="180" :show-overflow="false" :title="$t('common.operation')">
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
                <a-dropdown v-if="hasPermission(PermCodes.Merchant.Store.MANAGE)" :menu="getActionMenu(row)">
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

    <MchStoreInfoEdit ref="storeEditRef" @ok="queryPage" />
  </div>
</template>
