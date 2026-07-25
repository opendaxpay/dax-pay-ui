<script lang="ts" setup>
  // 兼容旧路径 `#/components/route/RouteQueryMissingState.vue`
  import { RouteQueryMissingState } from '@daxpay/ui-biz/components/route';
  defineOptions({ inheritAttrs: false });
</script>

<template>
  <RouteQueryMissingState v-bind="($attrs as any)">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </RouteQueryMissingState>
</template>
