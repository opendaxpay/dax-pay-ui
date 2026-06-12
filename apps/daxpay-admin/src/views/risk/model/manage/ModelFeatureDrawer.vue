<script lang="ts" setup>
  import type { Component } from 'vue';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import ConfigParamList from './config-param/ConfigParamList.vue';
  import ModelDataSourceList from './data-source/ModelDataSourceList.vue';
  import LookupTableList from './lookup/LookupTableList.vue';

  defineOptions({ name: 'ModelFeatureDrawer' });

  /** 一级抽屉支持的功能模块 */
  export type ModelFeatureKey = 'modelDataSource' | 'configParam' | 'lookupTable';

  const visible = ref(false);
  const modelId = ref('');
  const featureKey = ref<ModelFeatureKey>('modelDataSource');

  const featureMap: Record<ModelFeatureKey, { component: Component; titleKey: string; width: number | string }> = {
    modelDataSource: {
      component: ModelDataSourceList,
      titleKey: 'risk.model.manage.tab.modelDataSource',
      width: 960,
    },
    configParam: {
      component: ConfigParamList,
      titleKey: 'risk.model.manage.tab.configParam',
      width: 960,
    },
    lookupTable: {
      component: LookupTableList,
      titleKey: 'risk.model.manage.tab.lookupTable',
      width: 960,
    },
  };

  const activeComponent = computed(() => featureMap[featureKey.value].component);
  const drawerTitle = computed(() => $t(featureMap[featureKey.value].titleKey));
  const drawerWidth = computed(() => featureMap[featureKey.value].width);

  /** 打开功能抽屉 */
  function open(key: ModelFeatureKey, mId: string) {
    featureKey.value = key;
    modelId.value = mId;
    visible.value = true;
  }

  defineExpose({ open });
</script>

<template>
  <a-drawer v-model:open="visible" :title="drawerTitle" :size="drawerWidth" destroy-on-hidden>
    <component :is="activeComponent" :model-id="modelId" />
  </a-drawer>
</template>
