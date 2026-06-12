<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { type ConfigParamResult, ConfigParamApi } from '#/api/risk/model.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import ConfigParamEdit from './ConfigParamEdit.vue';

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
  const configParamEdit = ref();

  // 表格数据
  const tableData = ref<ConfigParamResult[]>([]);

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
    ConfigParamApi.listByModelId(props.modelId)
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
    configParamEdit.value?.show();
  }

  /** 编辑 */
  function handleEdit(row: ConfigParamResult) {
    configParamEdit.value?.showEdit(row.id);
  }

  /** 删除 */
  function handleDelete(row: ConfigParamResult) {
    confirm({
      // 国际化：删除确认提示
      content: $t('risk.configParam.base.action.confirmDelete'),
      onOk: () => {
        ConfigParamApi.delete(row.id!).then(() => {
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
      <vxe-column field="sortNo" :title="$t('risk.configParam.base.field.sortNo')" width="80" align="center" />
      <!-- 参数编码 -->
      <vxe-column field="paramCode" :title="$t('risk.configParam.base.field.paramCode')" :min-width="160" />
      <!-- 参数名称 -->
      <vxe-column field="paramName" :title="$t('risk.configParam.base.field.paramName')" :min-width="160" />
      <!-- 参数类型 -->
      <vxe-column field="paramType" :title="$t('risk.configParam.base.field.paramType')" width="100" align="center">
        <template #default="{ row }">
          <a-tag v-if="row.paramType === 'STRING'" color="blue">{{
            $t('risk.configParam.base.paramType.string')
          }}</a-tag>
          <a-tag v-else-if="row.paramType === 'NUMBER'" color="orange">{{
            $t('risk.configParam.base.paramType.number')
          }}</a-tag>
          <a-tag v-else-if="row.paramType === 'BOOLEAN'" color="green">{{
            $t('risk.configParam.base.paramType.boolean')
          }}</a-tag>
        </template>
      </vxe-column>
      <!-- 默认值 -->
      <vxe-column field="defaultValue" :title="$t('risk.configParam.base.field.defaultValue')" :min-width="160" />
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

    <ConfigParamEdit ref="configParamEdit" :model-id="modelId" @ok="queryList" />
  </div>
</template>
