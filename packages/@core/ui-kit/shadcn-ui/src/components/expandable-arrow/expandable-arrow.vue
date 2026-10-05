<script lang="ts" setup>
import { ChevronDown } from '@vben-core/icons';
import { cn } from '@vben-core/shared/utils';

const props = defineProps<{
  class?: string;
}>();

// 控制箭头展开/收起状态(显式泛型避免 default 字面量把类型收窄成 false)
const collapsed = defineModel<boolean>({ default: false });
</script>

<template>
  <div
    :class="cn('vben-link inline-flex items-center', props.class)"
    @click="collapsed = !collapsed"
  >
    <slot :is-expanded="collapsed">
      {{ collapsed }}
      <!-- <span>{{ isExpanded ? '收起' : '展开' }}</span> -->
    </slot>
    <div
      :class="{ 'rotate-180': !collapsed }"
      class="transition-transform duration-300"
    >
      <slot name="icon">
        <ChevronDown class="size-4" />
      </slot>
    </div>
  </div>
</template>
