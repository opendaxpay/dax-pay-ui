<script lang="ts" setup>
  import { ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { LookupTableApi, type LookupTableResult } from '#/api/risk/model.api';

  import InstanceLookupRowList from './InstanceLookupRowList.vue';

  const props = defineProps<{
    modelId: string;
    instanceId: string;
  }>();

  // 加载中
  const loading = ref(false);
  // 查表列表
  const tableData = ref<LookupTableResult[]>([]);
  // 行管理弹窗
  const rowListRef = ref<InstanceType<typeof InstanceLookupRowList>>();

  watch(
    () => props.modelId,
    (val) => {
      if (val) {
        queryList();
      }
    },
    { immediate: true },
  );

  /** 查询查表定义列表 */
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

  /** 管理实例行数据 */
  function handleManageRows(row: LookupTableResult) {
    rowListRef.value?.show(row);
  }
</script>

<template>
  <div>
    <p class="mb-3 text-sm text-muted-foreground">{{ $t('risk.modelInstance.lookup.readonlyStructureHint') }}</p>
    <vxe-table :data="tableData" :loading="loading" :row-config="{ keyField: 'id' }">
      <!-- 查表编码 -->
      <vxe-column field="code" :title="$t('risk.lookup.base.field.tableCode')" :min-width="180" />
      <!-- 查表名称 -->
      <vxe-column field="name" :title="$t('risk.lookup.base.field.name')" :min-width="180" />
      <!-- 键定义数 -->
      <vxe-column field="keyDefs" :title="$t('risk.lookup.base.field.keyDefCount')" width="100" align="center">
        <template #default="{ row }">{{ row.keyDefs?.length || 0 }}</template>
      </vxe-column>
      <!-- 操作 -->
      <vxe-column fixed="right" width="120" :title="$t('common.operation')">
        <template #default="{ row }">
          <a-button type="link" size="small" @click="handleManageRows(row)">{{
            $t('risk.modelInstance.lookup.manageRows')
          }}</a-button>
        </template>
      </vxe-column>
    </vxe-table>

    <InstanceLookupRowList ref="rowListRef" :instance-id="instanceId" @ok="queryList" />
  </div>
</template>
