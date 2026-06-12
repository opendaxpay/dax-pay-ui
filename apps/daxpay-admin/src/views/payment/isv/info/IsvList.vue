<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { type IsvInfo, IsvInfoApi } from '#/api/payment/isv.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import IsvAdd from './IsvAdd.vue';

  const router = useRouter();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const isvAdd = ref();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    // 名称
    {
      type: 'string',
      field: 'name',
      name: $t('payment.isv.base.field.name'),
      placeholder: $t('payment.isv.form.add.namePlaceholder'),
    },
    // 状态
    {
      type: 'list',
      field: 'status',
      name: $t('payment.isv.base.field.status'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        // 未激活
        { label: $t('payment.isv.base.status.inactive'), value: 'inactive' },
        // 启用
        { label: $t('payment.isv.base.status.enable'), value: 'enable' },
        // 禁用
        { label: $t('payment.isv.base.status.disabled'), value: 'disabled' },
      ],
    },
  ]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 表格数据
  const tableData = ref<IsvInfo[]>([]);

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    IsvInfoApi.page({
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

  /**
   * 重置查询
   */
  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /**
   * 新增
   */
  function handleAdd() {
    isvAdd.value?.show();
  }

  /**
   * 分页变化
   */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  /**
   * 管理服务商
   */
  function handleManage(row: IsvInfo) {
    router.push({ path: '/payment/isv/manage', query: { isvNo: row.isvNo! } });
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
              <!-- 新增 -->
              <a-button v-if="hasPermission(PermCodes.Payment.Isv.ADD)" type="primary" @click="handleAdd">{{
                $t('common.add')
              }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 序号 -->
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 服务商号 -->
          <vxe-column field="isvNo" :title="$t('payment.isv.base.field.isvNo')" :min-width="180" />
          <!-- 名称 -->
          <vxe-column field="name" :title="$t('payment.isv.base.field.name')" :min-width="200" />
          <!-- 简称 -->
          <vxe-column field="shortName" :title="$t('payment.isv.base.field.shortName')" :min-width="150" />
          <!-- 状态 -->
          <vxe-column field="status" :title="$t('payment.isv.base.field.status')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.status === 'inactive'" color="orange">{{
                $t('payment.isv.base.status.inactive')
              }}</a-tag>
              <a-tag v-else-if="row.status === 'enable'" color="green">{{
                $t('payment.isv.base.status.enable')
              }}</a-tag>
              <a-tag v-else color="red">{{ $t('payment.isv.base.status.disabled') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 管理员 -->
          <vxe-column
            field="administrator"
            :title="$t('payment.isv.base.field.administrator')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <!-- 国际化：已创建 -->
              <a-tag v-if="row.administrator" color="green">{{ $t('payment.isv.base.status.adminCreated') }}</a-tag>
              <!-- 国际化：未创建 -->
              <a-tag v-else color="default">{{ $t('payment.isv.base.status.adminNotCreated') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 创建时间 -->
          <vxe-column field="createTime" :title="$t('payment.isv.base.field.createTime')" :min-width="180" />
          <!-- 操作 -->
          <vxe-column fixed="right" width="100" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <!-- 管理 -->
              <a
                v-if="hasPermission(PermCodes.Payment.Isv.VIEW)"
                href="javascript:"
                class="vben-link"
                @click="handleManage(row)"
                >{{ $t('payment.isv.manage.manage.title') }}</a
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

    <IsvAdd ref="isvAdd" @ok="queryPage" />
  </div>
</template>
