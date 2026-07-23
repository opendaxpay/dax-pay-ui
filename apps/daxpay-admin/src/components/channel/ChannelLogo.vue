<script lang="ts" setup>
  // 兼容旧路径 `#/components/channel/ChannelLogo.vue`
  import { ChannelLogo as Logo } from '@daxpay/ui-biz/channel';

  withDefaults(
    defineProps<{
      channel?: string;
      product?: string;
      size?: number;
    }>(),
    {
      channel: '',
      product: '',
      size: 32,
    },
  );
</script>

<template>
  <Logo :channel="channel" :product="product" :size="size" />
</template>
