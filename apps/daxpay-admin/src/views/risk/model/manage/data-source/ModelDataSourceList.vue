<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { type ModelDataSourceResult, ModelDataSourceApi } from '#/api/risk/model.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import ModelDataSourceEdit from './ModelDataSourceEdit.vue';

  const props = defineProps<{
    modelId: string;
  }>();
  const { message, confirm } = useMessage();
  const { hasPermission } = usePermission();

  // 加载中
  const loading = ref(false);
  // 表格实例
  const xTable = ref<VxeTableInstance>();
  // 工具栏实例
  const xToolbar = ref<VxeToolbarInstance>();
  // 编辑弹窗引用
  const modelDataSourceEdit = ref();

  // 表格数据
  const tableData = ref<ModelDataSourceResult[]>([]);

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
  });

  watch(
    () => props.modelId,
    (val) => {
      if (val) {
        queryList();
      }
    },
    { immediate: true },
  );

  /** 查询列表 */
  function queryList() {
    loading.value = true;
    ModelDataSourceApi.listByModelId(props.modelId)
      .then((res: any) => {
        tableData.value = res.data || [];
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  /** 新增 */
  function handleAdd() {
    modelDataSourceEdit.value?.show();
  }

  /** 编辑 */
  function handleEdit(row: ModelDataSourceResult) {
    modelDataSourceEdit.value?.showEdit(row.id!);
  }

  /** 删除 */
  function handleDelete(row: ModelDataSourceResult) {
    confirm({
      // 国际化：删除确认提示
      content: $t('risk.modelDataSource.base.action.confirmDelete'),
      onOk: () => {
        ModelDataSourceApi.delete(row.id!).then(() => {
          message.success($t('common.success'));
          queryList();
        });
      },
    });
  }
</script>

<template>
  <div>
    <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryList }">
      <template #buttons>
        <a-space>
          <a-button v-if="hasPermission(PermCodes.Risk.ModelManage.EDIT)" type="primary" @click="handleAdd">{{
            $t('common.add')
          }}</a-button>
        </a-space>
      </template>
    </vxe-toolbar>
    <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
      <!-- 排序号 -->
      <vxe-column field="sortNo" :title="$t('risk.modelDataSource.base.field.sortNo')" width="80" align="center" />
      <!-- 数据源编码 -->
      <vxe-column
        field="dataSourceCode"
        :title="$t('risk.modelDataSource.base.field.dataSourceCode')"
        :min-width="200"
      />
      <!-- 数据源名称 -->
      <vxe-column
        field="dataSourceName"
        :title="$t('risk.modelDataSource.base.field.dataSourceName')"
        :min-width="200"
      />
      <!-- 加载类型 -->
      <vxe-column field="loadType" :title="$t('risk.modelDataSource.base.field.loadType')" width="150" align="center">
        <template #default="{ row }">
          <a-tag v-if="row.loadType === 'IMMEDIATE'" color="blue">{{
            $t('risk.modelDataSource.base.loadType.immediate')
          }}</a-tag>
          <a-tag v-else color="orange">{{ $t('risk.modelDataSource.base.loadType.lazy') }}</a-tag>
        </template>
      </vxe-column>
      <!-- 操作 -->
      <vxe-column fixed="right" width="120" :show-overflow="false" :title="$t('common.operation')">
        <template #default="{ row }">
          <a-space :size="2">
            <template #separator>
              <a-divider type="vertical" />
            </template>
            <a-button type="link" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</a-button>
            <a-button type="link" size="small" danger @click="handleDelete(row)">{{ $t('common.delete') }}</a-button>
          </a-space>
        </template>
      </vxe-column>
    </vxe-table>

    <ModelDataSourceEdit ref="modelDataSourceEdit" :model-id="modelId" @ok="queryList" />
  </div>
</template>
