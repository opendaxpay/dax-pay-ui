<script setup lang="ts">
  import AntdAppProvider from '@daxpay/ui-biz/components/AntdAppProvider';
  defineOptions({ inheritAttrs: false });
</script>

<template>
  <AntdAppProvider v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </AntdAppProvider>
</template>
