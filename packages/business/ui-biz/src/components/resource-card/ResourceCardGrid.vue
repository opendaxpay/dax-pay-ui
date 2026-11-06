<script lang="ts" setup>
  /**
   * 实体资源卡片网格(通用)
   * 响应式 auto-fill 网格: 最小列宽默认 340px(1440 下列宽可用区排 3 列, 1920 排 4 列), 间距 16px, 窄屏(≤640)单列。
   * 召唤卡(新增入口)经 #add 插槽传入, 与资源卡同尺寸同列。
   */
  defineOptions({ name: 'ResourceCardGrid' });

  withDefaults(
    defineProps<{
      /** 间距(px) */
      gap?: number;
      /** 最小列宽(px), 默认 340: 兼顾密度与长编号可读性 */
      minWidth?: number;
    }>(),
    {
      gap: 16,
      minWidth: 340,
    },
  );
</script>

<template>
  <div class="resource-card-grid" :style="{ '--rc-gap': `${gap}px`, '--rc-min': `${minWidth}px` }">
    <slot></slot>
    <slot name="add"></slot>
  </div>
</template>

<style scoped>
  .resource-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--rc-min, 340px), 1fr));
    gap: var(--rc-gap, 16px);
    align-items: stretch;

    /* 空态/加载态保留高度, 避免页面抖动 */
    min-height: 120px;
    padding: 0;
  }

  @media (max-width: 640px) {
    .resource-card-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
