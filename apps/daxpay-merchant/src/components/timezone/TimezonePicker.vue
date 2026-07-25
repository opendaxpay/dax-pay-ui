<script setup lang="ts">
  import { TimezonePicker } from '@daxpay/ui-biz/components/timezone';
  defineOptions({ inheritAttrs: false });
</script>

<template>
  <TimezonePicker v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </TimezonePicker>
</template>
