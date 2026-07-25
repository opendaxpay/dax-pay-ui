<script lang="ts" setup>
  import { computed } from 'vue';

  import { socialColorMap, socialLogoMap } from '../../enums/social';

  // 静态加载所有社交图标 SVG (Vite 构建期解析为资源 URL, 运行时按文件名查找)
  const socialIcons = import.meta.glob('../../assets/social/*.svg', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>;

  const props = withDefaults(
    defineProps<{
      // 平台编码(weChat/weCom/qq/github/gitee/feishu/dingTalk/douyin/alipay)
      source: string;
      // 图标尺寸(px)
      size?: number;
      // 圆角, 默认圆形
      radius?: string;
    }>(),
    {
      size: 64,
      radius: '50%',
    },
  );

  // SVG 文件 URL, 找不到时为 undefined(显示占位块)
  const logoSrc = computed(() => {
    const fileName = socialLogoMap[props.source];
    if (!fileName) {
      return undefined;
    }
    return socialIcons[`../../assets/social/${fileName}.svg`];
  });

  // 品牌色(用于占位块背景)
  const brandColor = computed(
    () => socialColorMap[props.source] ?? '#8b8b8b',
  );

  // 占位块显示的平台首字母
  const fallbackLetter = computed(() => {
    return props.source?.charAt(0)?.toUpperCase() || '?';
  });
</script>

<template>
  <span
    class="social-logo"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <img
      v-if="logoSrc"
      :src="logoSrc"
      :width="size"
      :height="size"
      :alt="source"
      class="logo-img"
    />
    <span
      v-else
      class="fallback-icon"
      :style="{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: brandColor,
        borderRadius: radius,
        fontSize: `${Math.max(size! * 0.4, 16)}px`,
      }"
    >
      {{ fallbackLetter }}
    </span>
  </span>
</template>

<style scoped>
  .social-logo {
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
    color: #fff;
    font-weight: 700;
    line-height: 1;
  }
</style>
