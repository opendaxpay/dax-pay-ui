<script lang="ts" setup>
  import { computed } from 'vue';

  import { vendorLogoMap } from '#/enums/payment/deviceEnum';

  defineOptions({ name: 'VendorLogo' });

  const props = withDefaults(
    defineProps<{
      vendor: string;
      size?: number;
    }>(),
    {
      size: 32,
    },
  );

  /** 厂商 SVG logo 的 URL */
  const logoSrc = computed(() => {
    const fileName = vendorLogoMap[props.vendor];
    if (!fileName) {
      return undefined;
    }
    try {
      return new URL(`/src/assets/device-vendor/${fileName}.svg`, import.meta.url).href;
    } catch {
      return undefined;
    }
  });
</script>

<template>
  <span class="vendor-logo" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="logoSrc" :src="logoSrc" :width="size" :height="size" :alt="vendor" class="logo-img" />
    <span
      v-else
      class="fallback-icon"
      :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.max(size! * 0.5, 14)}px` }"
    >
      🔈
    </span>
  </span>
</template>

<style scoped>
  .vendor-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
  }

  .logo-img {
    display: block;
    object-fit: contain;
  }

  .fallback-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    border-radius: 4px;
  }
</style>
