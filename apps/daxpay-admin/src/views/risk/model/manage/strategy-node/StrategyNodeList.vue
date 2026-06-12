<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { onMounted, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { type StrategyNodeResult, StrategyNodeApi } from '#/api/risk/model.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import StrategyNodeEdit from './StrategyNodeEdit.vue';

  const props = defineProps<{
    modelId: string;
  }>();

  const router = useRouter();
  const { message, confirm } = useMessage();
  const { hasPermission } = usePermission();

  // 加载中
  const loading = ref(false);
  // 表格实例
  const xTable = ref<VxeTableInstance>();
  // 工具栏实例
  const xToolbar = ref<VxeToolbarInstance>();
  // 编辑弹窗引用
  const strategyNodeEdit = ref();

  // 表格数据
  const tableData = ref<StrategyNodeResult[]>([]);

  // 决策模式映射
  const decisionModeMap: Record<string, string> = {
    ALL_PASS: 'risk.strategyNode.base.decisionMode.allPass',
    FIRST_HIT: 'risk.strategyNode.base.decisionMode.firstHit',
    ANY_PASS: 'risk.strategyNode.base.decisionMode.anyPass',
  };

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
    StrategyNodeApi.listByModelId(props.modelId)
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
    strategyNodeEdit.value?.show();
  }

  /** 编辑 */
  function handleEdit(row: StrategyNodeResult) {
    strategyNodeEdit.value?.showEdit(row.id);
  }

  /** 删除 */
  function handleDelete(row: StrategyNodeResult) {
    confirm({
      content: $t('risk.strategyNode.base.action.confirmDelete'),
      onOk: () => {
        StrategyNodeApi.delete(row.id!).then(() => {
          message.success($t('common.success'));
          queryList();
        });
      },
    });
  }

  /** 管理规则 */
  function handleManageRule(row: StrategyNodeResult) {
    router.push({
      path: '/risk/model/manage/strategy-node/rules',
      query: { modelId: props.modelId, strategyNodeId: row.id! },
    });
  }
</script>

<template>
  <div>
    <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryList }">
      <template #buttons>
        <a-space>
          <a-button v-if="hasPermission(PermCodes.Risk.ModelManage.StrategyNode.ADD)" type="primary" @click="handleAdd">{{
            $t('common.add')
          }}</a-button>
        </a-space>
      </template>
    </vxe-toolbar>
    <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
      <!-- 排序号 -->
      <vxe-column field="sortNo" :title="$t('risk.strategyNode.base.field.sortNo')" width="80" align="center" />
      <!-- 节点名称 -->
      <vxe-column field="nodeName" :title="$t('risk.strategyNode.base.field.nodeName')" :min-width="160" />
      <!-- 决策模式 -->
      <vxe-column
        field="decisionMode"
        :title="$t('risk.strategyNode.base.field.decisionMode')"
        width="120"
        align="center"
      >
        <template #default="{ row }">
          <a-tag v-if="row.decisionMode" color="blue">{{
            $t(decisionModeMap[row.decisionMode] || row.decisionMode)
          }}</a-tag>
        </template>
      </vxe-column>
      <!-- 准入条件 -->
      <vxe-column field="precondition" :title="$t('risk.strategyNode.base.field.precondition')" :min-width="200">
        <template #default="{ row }">
          <span v-if="row.precondition" class="text-sm text-muted-foreground">{{ row.precondition }}</span>
          <span v-else class="text-sm text-muted-foreground">-</span>
        </template>
      </vxe-column>
      <!-- 操作 -->
      <vxe-column fixed="right" width="200" :show-overflow="false" :title="$t('common.operation')">
        <template #default="{ row }">
          <a-space :size="2">
            <template #separator>
              <a-divider type="vertical" />
            </template>
            <a-button type="link" size="small" @click="handleManageRule(row)">{{
              $t('risk.strategyNode.base.action.manageRule')
            }}</a-button>
            <a-button type="link" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</a-button>
            <a-button type="link" size="small" danger @click="handleDelete(row)">{{ $t('common.delete') }}</a-button>
          </a-space>
        </template>
      </vxe-column>
    </vxe-table>

    <StrategyNodeEdit ref="strategyNodeEdit" :model-id="modelId" @ok="queryList" />
  </div>
</template>
