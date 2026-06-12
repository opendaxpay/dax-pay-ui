<script lang="ts" setup>
  import type { Component } from 'vue';

  import type { RuleNodeResult, StrategyNodeResult } from '#/api/risk/model.api';

  import { computed, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { StrategyNodeApi } from '#/api/risk/model.api';

  import LookupInfoPanel from './LookupInfoPanel.vue';
  import RuleEntryPanel from './RuleEntryPanel.vue';
  import RuleNodeSidebar from './RuleNodeSidebar.vue';
  import ScorecardPanel from './ScorecardPanel.vue';

  defineOptions({ name: 'StrategyRuleStudio' });

  const route = useRoute();
  const router = useRouter();

  const loading = ref(false);
  const modelId = ref('');
  const strategyNodeId = ref('');
  const strategyNode = ref<StrategyNodeResult>({});
  const selectedRuleNodeId = ref('');
  const activeRuleNode = ref<RuleNodeResult | null>(null);

  const detailPanelMap: Record<string, Component> = {
    DECISION: RuleEntryPanel,
    NUMBER: RuleEntryPanel,
    SCORECARD: ScorecardPanel,
    LOOKUP: LookupInfoPanel,
  };

  const activeDetailPanel = computed(() => {
    const type = activeRuleNode.value?.type;
    if (!type) {
      return null;
    }
    return detailPanelMap[type] || null;
  });

  const activeRuleTypeLabel = computed(() => {
    const type = activeRuleNode.value?.type;
    if (!type) {
      return '';
    }
    return $t(`risk.ruleNode.base.ruleType.${type.toLowerCase()}`) || type;
  });

  onMounted(() => {
    initFromRoute();
  });

  watch(
    () => route.query,
    () => {
      initFromRoute();
    },
  );

  watch(selectedRuleNodeId, (id) => {
    if (!id) {
      activeRuleNode.value = null;
    }
  });

  /** 从路由参数初始化 */
  function initFromRoute() {
    modelId.value = (route.query.modelId as string) || '';
    strategyNodeId.value = (route.query.strategyNodeId as string) || '';
    if (strategyNodeId.value) {
      loadStrategyNode();
    }
  }

  /** 加载策略节点详情 */
  function loadStrategyNode() {
    loading.value = true;
    StrategyNodeApi.findById(strategyNodeId.value)
      .then(({ data }) => {
        strategyNode.value = data || {};
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 选中规则节点 */
  function handleRuleNodeSelect(ruleNode: RuleNodeResult) {
    activeRuleNode.value = ruleNode;
  }

  /** 返回策略节点列表 */
  function handleBack() {
    router.push({
      path: '/risk/model/manage/strategy-node',
      query: { modelId: modelId.value },
    });
  }
</script>

<template>
  <div class="studio-page">
    <a-spin :spinning="loading">
      <a-card variant="borderless" class="studio-card rounded-xl shadow-sm">
        <div class="mb-4 border-b border-border pb-4">
          <div class="flex items-center gap-2">
            <a-button
              type="text"
              class="flex items-center justify-center rounded-full hover:bg-accent"
              @click="handleBack"
            >
              <template #icon>
                <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
              </template>
            </a-button>
            <div>
              <div class="flex items-baseline gap-2">
                <span class="text-lg font-bold text-foreground">{{ $t('risk.strategyNode.studio.title') }}</span>
                <span v-if="strategyNode.nodeName" class="text-sm text-muted-foreground">{{
                  strategyNode.nodeName
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="studio-layout">
          <aside class="studio-sidebar">
            <RuleNodeSidebar
              v-model:selected-id="selectedRuleNodeId"
              :strategy-node-id="strategyNodeId"
              :model-id="modelId"
              @select="handleRuleNodeSelect"
            />
          </aside>

          <section class="studio-content">
            <template v-if="activeRuleNode && activeDetailPanel">
              <div class="mb-4 flex items-center gap-2">
                <span class="font-bold">{{ activeRuleNode.nodeName }}</span>
                <a-tag color="blue">{{ activeRuleTypeLabel }}</a-tag>
              </div>
              <component :is="activeDetailPanel" :rule-node="activeRuleNode" />
            </template>
            <a-empty v-else :description="$t('risk.strategyNode.studio.selectRuleNodeHint')" />
          </section>
        </div>
      </a-card>
    </a-spin>
  </div>
</template>

<style scoped>
  .studio-page {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    padding: 16px;
  }

  .studio-card {
    min-height: calc(100vh - 120px);
  }

  .studio-layout {
    display: flex;
    gap: 16px;
    min-height: calc(100vh - 280px);
  }

  .studio-sidebar {
    flex: 0 0 280px;
    min-width: 0;
    min-height: 0;
    padding-right: 16px;
    border-right: 1px solid hsl(var(--border));
  }

  .studio-content {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
  }
</style>
