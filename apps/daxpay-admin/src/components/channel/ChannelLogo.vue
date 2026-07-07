<script lang="ts" setup>
  import { computed } from 'vue';

  import { channelLogoMap, productLogoMap } from '#/enums/payment';

  const props = withDefaults(
    defineProps<{
      /** 通道编码（回退取通道Logo）；产品上下文建议同时传 product */
      channel?: string;
      /** 支付产品编码；命中 productLogoMap 时优先使用产品独立Logo */
      product?: string;
      size?: number;
    }>(),
    {
      channel: '',
      product: '',
      size: 32,
    },
  );

  /** 根据文件名解析 assets/channel/ 下 SVG 资源 URL，文件不存在返回 undefined */
  function resolveSvg(fileName: string): string | undefined {
    try {
      return new URL(`/src/assets/channel/${fileName}.svg`, import.meta.url).href;
    } catch {
      return undefined;
    }
  }

  const logoSrc = computed(() => {
    // 优先：产品独立Logo（如河马付等独立品牌产品）
    if (props.product) {
      const productFile = productLogoMap[props.product];
      if (productFile) {
        const src = resolveSvg(productFile);
        if (src) return src;
      }
    }
    // 回退：通道Logo
    if (props.channel) {
      const channelFile = channelLogoMap[props.channel];
      if (channelFile) {
        return resolveSvg(channelFile);
      }
    }
    return undefined;
  });
</script>

<template>
  <span class="channel-logo" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="logoSrc" :src="logoSrc" :width="size" :height="size" :alt="product || channel" class="logo-img" />
    <span
      v-else
      class="fallback-icon"
      :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.max(size! * 0.5, 14)}px` }"
    >
      💳
    </span>
  </span>
</template>

<style scoped>
  .channel-logo {
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
