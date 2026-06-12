<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type DataSourceDefSyncResult, DataSourceDefApi } from '#/api/risk/model.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const { message, confirm } = useMessage();
  const { hasPermission } = usePermission();

  // 表格引用
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 加载状态
  const loading = ref(false);

  // 表格数据
  const tableData = ref<any[]>([]);

  // 查询参数
  const queryForm = ref<Record<string, any>>({});

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'code',
      name: $t('risk.dataSourceDef.base.field.code'),
      placeholder: $t('risk.dataSourceDef.base.field.code'),
    },
    {
      type: 'string',
      field: 'name',
      name: $t('risk.dataSourceDef.base.field.name'),
      placeholder: $t('risk.dataSourceDef.base.field.name'),
    },
    {
      type: 'string',
      field: 'className',
      name: $t('risk.dataSourceDef.base.field.className'),
      placeholder: $t('risk.dataSourceDef.base.field.className'),
    },
  ]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /** 分页查询 */
  function queryPage() {
    loading.value = true;
    DataSourceDefApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    }).then((res: any) => {
      tableData.value = res.data.records || [];
      pageConfig.value.total = Number(res.data.total) || 0;
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
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  /** 同步数据源 */
  function handleSync() {
    confirm({
      content: $t('risk.dataSourceDef.base.action.syncConfirm'),
      onOk: async () => {
        const res = await DataSourceDefApi.scan();
        const result: DataSourceDefSyncResult = res.data || {};
        message.success(
          // 国际化：同步结果提示
          $t('risk.dataSourceDef.base.action.syncResult', {
            added: result.added ?? 0,
            updated: result.updated ?? 0,
          }),
        );
        queryPage();
      },
    });
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
              <a-button v-if="hasPermission(PermCodes.Risk.DataSourceDef.MANAGE)" type="primary" @click="handleSync">{{
                $t('risk.dataSourceDef.base.action.sync')
              }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 数据源编码 -->
          <vxe-column field="code" :title="$t('risk.dataSourceDef.base.field.code')" :min-width="200" />
          <!-- 数据源名称 -->
          <vxe-column field="name" :title="$t('risk.dataSourceDef.base.field.name')" :min-width="200" />
          <!-- 提供者类名 -->
          <vxe-column field="className" :title="$t('risk.dataSourceDef.base.field.className')" :min-width="200" />
          <!-- 备注 -->
          <vxe-column field="remark" :title="$t('risk.dataSourceDef.base.field.remark')" :min-width="200" />
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
  </div>
</template>
