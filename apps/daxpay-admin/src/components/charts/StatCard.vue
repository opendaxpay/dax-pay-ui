<script setup lang="ts">
  import { StatCard } from '@daxpay/ui-biz/components/charts';
  defineOptions({ inheritAttrs: false });
</script>

<template>
  <StatCard v-bind="($attrs as any)">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </StatCard>
</template>
