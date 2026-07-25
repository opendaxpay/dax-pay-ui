<script setup lang="ts">
  import { ChartCard } from '@daxpay/ui-biz/components/charts';
  defineOptions({ inheritAttrs: false });
</script>

<template>
  <ChartCard v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </ChartCard>
</template>
