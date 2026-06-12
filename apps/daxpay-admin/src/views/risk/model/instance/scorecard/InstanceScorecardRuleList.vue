<script lang="ts" setup>
  import { ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { InstanceScorecardApi, type RuleNodeResult } from '#/api/risk/model.api';

  import InstanceScorecardPanel from './InstanceScorecardPanel.vue';

  const props = defineProps<{
    modelId: string;
    instanceId: string;
  }>();

  // 加载中
  const loading = ref(false);
  // 规则节点列表
  const ruleNodes = ref<RuleNodeResult[]>([]);
  // 评分卡面板
  const scorecardPanelRef = ref<InstanceType<typeof InstanceScorecardPanel>>();

  watch(
    () => props.modelId,
    (val) => {
      if (val) {
        queryList();
      }
    },
    { immediate: true },
  );

  /** 查询 SCORECARD 规则节点 */
  function queryList() {
    loading.value = true;
    InstanceScorecardApi.listRuleNodes(props.modelId)
      .then((res: any) => {
        ruleNodes.value = res.data || [];
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  /** 配置评分卡数据 */
  function handleManage(row: RuleNodeResult) {
    scorecardPanelRef.value?.show(row);
  }
</script>

<template>
  <div>
    <p class="mb-3 text-sm text-muted-foreground">{{ $t('risk.modelInstance.scorecard.readonlyDimensionHint') }}</p>
    <vxe-table :data="ruleNodes" :loading="loading" :row-config="{ keyField: 'id' }">
      <!-- 规则节点名称 -->
      <vxe-column field="nodeName" :title="$t('risk.ruleNode.base.field.nodeName')" :min-width="180" />
      <!-- 规则节点ID -->
      <vxe-column field="nodeId" :title="$t('risk.ruleNode.base.field.nodeId')" :min-width="160" />
      <!-- 操作 -->
      <vxe-column fixed="right" width="120" :title="$t('common.operation')">
        <template #default="{ row }">
          <a-button type="link" size="small" @click="handleManage(row)">{{
            $t('risk.modelInstance.scorecard.manageData')
          }}</a-button>
        </template>
      </vxe-column>
    </vxe-table>

    <InstanceScorecardPanel ref="scorecardPanelRef" :instance-id="instanceId" />
  </div>
</template>
