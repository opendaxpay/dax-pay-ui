<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { type MerchantInfo, MerchantApi } from '#/api/payment/merchant.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import MerchantAdd from './MerchantAdd.vue';

  const router = useRouter();
  const { hasPermission } = usePermission();

  // 商户新增权限
  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const merchantAdd = ref();

  const queryForm = ref<Record<string, any>>({});

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'mchName',
      name: $t('payment.merchant.base.field.mchName'),
      placeholder: $t('payment.merchant.form.add.mchNamePlaceholder'),
    },
    {
      type: 'list',
      field: 'subjectType',
      name: $t('payment.merchant.base.field.subjectType'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.merchant.base.subjectType.micro'), value: 'micro' },
        { label: $t('payment.merchant.base.subjectType.individual'), value: 'individual' },
        { label: $t('payment.merchant.base.subjectType.enterprise'), value: 'enterprise' },
      ],
    },
    {
      type: 'list',
      field: 'status',
      name: $t('payment.merchant.base.field.status'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.merchant.base.status.enable'), value: 'enable' },
        { label: $t('payment.merchant.base.status.disabled'), value: 'disabled' },
      ],
    },
  ]);

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<MerchantInfo[]>([]);

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  function queryPage() {
    loading.value = true;
    MerchantApi.page({
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
    return Promise.resolve();
  }

  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  function handleAdd() {
    merchantAdd.value?.show();
  }

  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  function handleManage(row: MerchantInfo) {
    router.push({ path: '/payment/merchant/manage', query: { mchNo: row.mchNo! } });
  }
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
            <a-space>
              <a-button v-if="hasPermission(PermCodes.Payment.Merchant.ADD)" type="primary" @click="handleAdd">{{
                $t('common.add')
              }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column field="mchNo" :title="$t('payment.merchant.base.field.mchNo')" :min-width="180" />
          <vxe-column field="mchName" :title="$t('payment.merchant.base.field.mchName')" :min-width="200" />
          <vxe-column field="mchShortName" :title="$t('payment.merchant.base.field.mchShortName')" :min-width="150" />
          <vxe-column field="isvName" :title="$t('payment.merchant.base.field.isvName')" :min-width="150" />
          <vxe-column
            field="subjectType"
            :title="$t('payment.merchant.base.field.subjectType')"
            :min-width="120"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.subjectType === 'micro'" color="blue">{{
                $t('payment.merchant.base.subjectType.micro')
              }}</a-tag>
              <a-tag v-else-if="row.subjectType === 'individual'" color="green">{{
                $t('payment.merchant.base.subjectType.individual')
              }}</a-tag>
              <a-tag v-else-if="row.subjectType === 'enterprise'" color="purple">{{
                $t('payment.merchant.base.subjectType.enterprise')
              }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="status" :title="$t('payment.merchant.base.field.status')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.status === 'enable'" color="green">{{
                $t('payment.merchant.base.status.enable')
              }}</a-tag>
              <a-tag v-else color="red">{{ $t('payment.merchant.base.status.disabled') }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="createTime" :title="$t('payment.merchant.base.field.createTime')" :min-width="180" formatter="formatDateTime" />
          <vxe-column fixed="right" width="100" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a
                v-if="hasPermission(PermCodes.Payment.Merchant.VIEW)"
                href="javascript:"
                class="vben-link"
                @click="handleManage(row)"
                >{{ $t('payment.merchant.manage.manage.title') }}</a
              >
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

    <MerchantAdd ref="merchantAdd" @ok="queryPage" />
  </div>
</template>
