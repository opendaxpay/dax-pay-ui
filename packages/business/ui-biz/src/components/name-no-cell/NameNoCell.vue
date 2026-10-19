<script setup lang="ts">
/**
 * 「名称(编号)」展示单元格
 *
 * 商户列等「名称+编号」的统一形态: 名称为主体正常字号在前,
 * 编号以小灰字括号缀后; 仅编号无名称时编号升为主体, 两者皆空显示占位符(默认 '-')。
 */
const props = defineProps<{
  /** 主体名称(如商户名) */
  name?: string;
  /** 编号(如商户号) */
  no?: string;
  /** 名称与编号皆空时的占位符 */
  fallback?: string;
}>();
</script>

<template>
  <span v-if="props.name || props.no"
    >{{ props.name || props.no
    }}<span v-if="props.name && props.no" class="text-xs text-muted-foreground"
      >({{ props.no }})</span
    ></span
  >
  <span v-else>{{ props.fallback ?? '-' }}</span>
</template>
