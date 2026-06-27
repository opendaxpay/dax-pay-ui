<script lang="ts" setup>
  import { computed, onMounted } from 'vue';

  import { useDashboardData } from './composables/useDashboardData';
  import { getDefaultLayout, getWidgetMeta, HEADER_WIDGET_ID, WIDGET_REGISTRY } from './widget-registry';

  // 工作台聚合数据：并行拉取各业务域统计计数
  const dashboardData = useDashboardData();

  // 默认布局（未来可改为 ref + localStorage / 后端持久化）
  const layout = computed(() => getDefaultLayout());

  // widget id → meta 映射，便于模板查找组件
  const widgetMap = computed(() => Object.fromEntries(WIDGET_REGISTRY.map((w) => [w.id, w])));

  // header widget（单独全宽渲染，不进栅格）
  const headerMeta = computed(() => getWidgetMeta(HEADER_WIDGET_ID));

  onMounted(() => {
    // 进入工作台即拉取一次聚合数据
    dashboardData.refresh();
  });
</script>

<template>
  <div class="p-4">
    <!-- Header 全宽 -->
    <component :is="headerMeta?.component" v-if="headerMeta" :data="dashboardData" />

    <!-- 其余 widgets 按 24 栅格布局渲染 -->
    <a-row :gutter="[16, 16]" align="stretch" class="mt-4">
      <a-col v-for="item in layout" :key="item.widgetId" :span="item.span">
        <component :is="widgetMap[item.widgetId]?.component" :data="dashboardData" />
      </a-col>
    </a-row>
  </div>
</template>
