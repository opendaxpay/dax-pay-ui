<script lang="ts" setup>
  import type { Component } from 'vue';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import InstanceConfigParamList from './config/InstanceConfigParamList.vue';
  import InstanceLookupTableList from './lookup/InstanceLookupTableList.vue';
  import InstanceScorecardRuleList from './scorecard/InstanceScorecardRuleList.vue';

  defineOptions({ name: 'InstanceFeatureDrawer' });

  /** 实例配置抽屉功能模块 */
  export type InstanceFeatureKey = 'configParam' | 'lookupTable' | 'scorecard';

  const visible = ref(false);
  const modelId = ref('');
  const instanceId = ref('');
  const featureKey = ref<InstanceFeatureKey>('configParam');

  const featureMap: Record<InstanceFeatureKey, { component: Component; titleKey: string; width: number | string }> = {
    configParam: {
      component: InstanceConfigParamList,
      titleKey: 'risk.modelInstance.workbench.cardConfigParam',
      width: 960,
    },
    lookupTable: {
      component: InstanceLookupTableList,
      titleKey: 'risk.modelInstance.workbench.cardLookupTable',
      width: 960,
    },
    scorecard: {
      component: InstanceScorecardRuleList,
      titleKey: 'risk.modelInstance.workbench.cardScorecard',
      width: 960,
    },
  };

  const activeComponent = computed(() => featureMap[featureKey.value].component);
  const drawerTitle = computed(() => $t(featureMap[featureKey.value].titleKey));
  const drawerWidth = computed(() => featureMap[featureKey.value].width);

  /** 打开功能抽屉 */
  function open(key: InstanceFeatureKey, mId: string, instId: string) {
    featureKey.value = key;
    modelId.value = mId;
    instanceId.value = instId;
    visible.value = true;
  }

  defineExpose({ open });
</script>

<template>
  <a-drawer v-model:open="visible" :title="drawerTitle" :size="drawerWidth" destroy-on-hidden>
    <component :is="activeComponent" :model-id="modelId" :instance-id="instanceId" />
  </a-drawer>
</template>
