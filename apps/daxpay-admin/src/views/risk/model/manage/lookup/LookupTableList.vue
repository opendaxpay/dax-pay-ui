<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { type LookupTableResult, LookupTableApi } from '#/api/risk/model.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import LookupTableEdit from './LookupTableEdit.vue';

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
  const lookupEdit = ref();

  // 表格数据
  const tableData = ref<LookupTableResult[]>([]);

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
    LookupTableApi.listByModelId(props.modelId)
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
    lookupEdit.value?.show();
  }

  /** 编辑 */
  function handleEdit(row: LookupTableResult) {
    lookupEdit.value?.showEdit(row);
  }

  /** 删除 */
  function handleDelete(row: LookupTableResult) {
    confirm({
      // 国际化：删除确认提示
      content: $t('risk.lookup.base.action.confirmDelete'),
      onOk: () => {
        LookupTableApi.delete(row.id!).then(() => {
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
      <!-- 查表编码 -->
      <vxe-column field="code" :title="$t('risk.lookup.base.field.tableCode')" :min-width="200" />
      <!-- 查表名称 -->
      <vxe-column field="name" :title="$t('risk.lookup.base.field.name')" :min-width="200" />
      <!-- 键定义数 -->
      <vxe-column field="keyDefs" :title="$t('risk.lookup.base.field.keyDefCount')" width="100" align="center">
        <template #default="{ row }">
          {{ row.keyDefs?.length || 0 }}
        </template>
      </vxe-column>
      <!-- 行数据数 -->
      <vxe-column field="rows" :title="$t('risk.lookup.base.field.rowCount')" width="100" align="center">
        <template #default="{ row }">
          {{ row.rows?.length || 0 }}
        </template>
      </vxe-column>
      <!-- 操作 -->
      <vxe-column fixed="right" width="150" :show-overflow="false" :title="$t('common.operation')">
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

    <LookupTableEdit ref="lookupEdit" :model-id="modelId" @ok="queryList" />
  </div>
</template>
