<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { PayCapabilityApi, type PayCapabilityResult } from '#/api/payment/masterdata/capability.api';
  import { BQuery, type QueryField } from '#/components/query';

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 抽屉
  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const capabilityDetail = ref<PayCapabilityResult>({});

  // 查询字段
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'name',
      name: $t('payment.constant.capability.field.name'),
      placeholder: $t('payment.constant.capability.placeholder.name'),
    },
    {
      type: 'string',
      field: 'code',
      name: $t('payment.constant.capability.field.code'),
      placeholder: $t('payment.constant.capability.placeholder.code'),
    },
  ]);

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<PayCapabilityResult[]>([]);

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /**
   * 分页查询
   */
  function queryPage() {
    loading.value = true;
    return PayCapabilityApi.page({
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

  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  function handlePageChange({ currentPage, pageSize }: { currentPage: number; pageSize: number }) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  async function loadDetail(code: string) {
    drawerLoading.value = true;
    const { data } = await PayCapabilityApi.findByCode(code);
    capabilityDetail.value = data || {};
    drawerLoading.value = false;
  }

  async function handleView(row: PayCapabilityResult) {
    drawerVisible.value = true;
    await loadDetail(row.code!);
  }

  function handleDrawerClose() {
    drawerVisible.value = false;
    capabilityDetail.value = {};
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
          <vxe-column field="name" :title="$t('payment.constant.capability.field.name')" :min-width="160" />
          <vxe-column field="code" :title="$t('payment.constant.capability.field.code')" :min-width="200" />
          <!-- 能力介绍 -->
          <vxe-column
            field="description"
            :title="$t('payment.constant.capability.field.description')"
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
      :title="$t('payment.constant.capability.detail')"
      :size="780"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item :label="$t('payment.constant.capability.field.name')">
            {{ capabilityDetail.name || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.capability.field.code')">
            {{ capabilityDetail.code || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.capability.field.products')">
            <div class="detail-tags">
              <a-tag v-for="item in capabilityDetail.products || []" :key="item.value">
                {{ item.label }}
              </a-tag>
              <span v-if="(capabilityDetail.products || []).length === 0">-</span>
            </div>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.constant.capability.field.description')">
            {{ capabilityDetail.description || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>

      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>
  </div>
</template>

<style scoped>
  .detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
</style>
