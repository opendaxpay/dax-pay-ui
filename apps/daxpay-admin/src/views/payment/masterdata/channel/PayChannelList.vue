<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type { PayProductResult } from '#/api/payment/masterdata/product.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { PayChannelApi, type PayChannelItem } from '#/api/payment/masterdata/channel.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { BQuery, type QueryField } from '#/components/query';
  import { channelI18nMap, channelNameMap } from '#/enums/payment/channelEnum';

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 抽屉
  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<PayChannelItem>({});
  // 详情抽屉：支付产品列表
  const channelProducts = ref<PayProductResult[]>([]);

  // 查询字段
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'name',
      name: $t('payment.constant.channel.field.name'),
      placeholder: $t('payment.constant.channel.placeholder.name'),
    },
    {
      type: 'string',
      field: 'code',
      name: $t('payment.constant.channel.field.code'),
      placeholder: $t('payment.constant.channel.placeholder.code'),
    },
  ]);

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<PayChannelItem[]>([]);

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /** 分页查询 */
  function queryPage() {
    loading.value = true;
    return PayChannelApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
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
  }

  /** 重置查询 */
  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /** 分页变化 */
  function handlePageChange({ currentPage, pageSize }: { currentPage: number; pageSize: number }) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  /** 获取通道名称（API 优先，本地 i18n 兜底） */
  function getChannelName(row: PayChannelItem) {
    if (row.name) {
      return row.name;
    }
    const code = row.code;
    if (!code) {
      return '-';
    }
    const i18nKey = channelI18nMap[code];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return channelNameMap[code] || code;
  }

  /** 加载通道详情及支付产品（并行请求，列表页不联查） */
  async function loadDetail(channelCode: string) {
    drawerLoading.value = true;
    const [channelRes, productsRes] = await Promise.all([
      PayChannelApi.findByCode(channelCode),
      PayChannelApi.listProductsByChannel(channelCode),
    ]);
    detail.value = channelRes.data || {};
    channelProducts.value = productsRes.data || [];
    drawerLoading.value = false;
  }

  /** 查看详情 */
  async function handleView(row: PayChannelItem) {
    detail.value = { ...row };
    channelProducts.value = [];
    drawerVisible.value = true;
    if (row.code) {
      await loadDetail(row.code);
    }
  }

  /** 关闭抽屉 */
  function handleDrawerClose() {
    drawerVisible.value = false;
    detail.value = {};
    channelProducts.value = [];
  }
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column :title="$t('payment.constant.channel.field.icon')" width="80" align="center">
            <template #default="{ row }">
              <ChannelLogo v-if="row.code" :channel="row.code" :size="28" />
            </template>
          </vxe-column>
          <vxe-column :title="$t('payment.constant.channel.field.name')" :min-width="160">
            <template #default="{ row }">
              {{ getChannelName(row) }}
            </template>
          </vxe-column>
          <vxe-column field="code" :title="$t('payment.constant.channel.field.code')" :min-width="140" />
          <!-- 通道介绍 -->
          <vxe-column
            field="description"
            :title="$t('payment.constant.channel.field.description')"
            :min-width="200"
            show-overflow
          />
          <vxe-column :title="$t('common.action')" width="80" align="center" fixed="right">
            <template #default="{ row }">
              <a-button type="link" size="small" @click="handleView(row)">
                {{ $t('common.view') }}
              </a-button>
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

    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('payment.constant.channel.detail')"
      :size="780"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item :label="$t('payment.constant.channel.field.name')">
            <span class="inline-flex items-center gap-2">
              <ChannelLogo v-if="detail.code" :channel="detail.code" :size="24" />
              {{ getChannelName(detail) }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.channel.field.code')">
            {{ detail.code || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.channel.field.description')">
            {{ detail.description || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider class="!my-4" />
        <div class="mb-2 font-medium">{{ $t('payment.constant.channel.section.products') }}</div>
        <vxe-table
          v-if="channelProducts.length > 0"
          :row-config="{ keyField: 'id' }"
          :data="channelProducts"
          size="small"
        >
          <vxe-column field="name" :title="$t('payment.constant.product.field.name')" :min-width="140" />
          <vxe-column field="code" :title="$t('payment.constant.product.field.code')" :min-width="130" />
          <vxe-column :title="$t('payment.constant.product.field.sandbox')" width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.sandbox" color="cyan">{{ $t('payment.constant.product.sandboxSupported') }}</a-tag>
              <a-tag v-else>{{ $t('payment.constant.product.sandboxNotSupported') }}</a-tag>
            </template>
          </vxe-column>
        </vxe-table>
        <a-empty v-else :description="$t('payment.constant.channel.empty.products')" />
      </a-spin>
      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>
  </div>
</template>
