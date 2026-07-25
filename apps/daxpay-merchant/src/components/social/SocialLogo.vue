<script lang="ts" setup>
  // 兼容旧路径 `#/components/social/SocialLogo.vue`
  import { SocialLogo } from '@daxpay/ui-biz/components/social';
  defineOptions({ inheritAttrs: false });
</script>

<template>
  <SocialLogo v-bind="($attrs as any)">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </SocialLogo>
</template>
