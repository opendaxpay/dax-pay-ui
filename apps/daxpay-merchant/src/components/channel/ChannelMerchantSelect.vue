<script lang="ts" setup>
  // 兼容旧路径 `#/components/channel/ChannelMerchantSelect.vue`
  import { ChannelMerchantSelect } from '@daxpay/ui-biz/channel';
  defineOptions({ inheritAttrs: false });
</script>

<template>
  <ChannelMerchantSelect v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </ChannelMerchantSelect>
</template>
