<script lang="ts" setup>
  import { computed } from 'vue';

  import { channelLogoMap } from '#/enums/payment';

  const props = withDefaults(
    defineProps<{
      channel: string;
      size?: number;
    }>(),
    {
      size: 32,
    },
  );

  const logoSrc = computed(() => {
    const fileName = channelLogoMap[props.channel];
    if (!fileName) {
      return undefined;
    }
    try {
      return new URL(`/src/assets/channel/${fileName}.svg`, import.meta.url).href;
    }
    catch {
      return undefined;
    }
  });
</script>

<template>
  <span class="channel-logo" :style="{ width: size + 'px', height: size + 'px' }">
    <img
      v-if="logoSrc"
      :src="logoSrc"
      :width="size"
      :height="size"
      :alt="channel"
      class="logo-img"
    />
    <span
      v-else
      class="fallback-icon"
      :style="{ width: size + 'px', height: size + 'px', fontSize: Math.max(size * 0.5, 14) + 'px' }"
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
