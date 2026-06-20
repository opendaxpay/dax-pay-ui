<script setup lang="ts">
  import { computed, useSlots } from 'vue';

  import { $t } from '@vben/locales';

  interface Props {
    /** 用户名（取首字作为头像文字） */
    text?: string;
    /** 头像尺寸（像素），默认 32 */
    size?: number;
    /** 是否显示环形主题色描边 */
    ring?: boolean;
    /** 是否显示外层柔光（锁屏页解锁卡片风格） */
    glow?: boolean;
  }

  defineOptions({
    inheritAttrs: false,
  });

  const props = withDefaults(defineProps<Props>(), {
    text: '',
    size: 32,
    ring: false,
    glow: false,
  });

  const slots = useSlots();

  // 头像文字：优先取用户名首字并大写；用户名为空时回退到“访客/Guest”首字
  const fallbackText = computed(() => {
    const source = props.text || $t('ui.widgets.lockScreen.guest');
    return source?.charAt(0)?.toUpperCase() || '?';
  });

  // 是否使用默认首字渲染（未传默认 slot 时才用 fallbackText）
  const useDefaultContent = computed(() => !slots.default);
</script>

<template>
  <!-- 外层包裹：仅 glow 开启时渲染柔光层 -->
  <div
    :style="{ width: `${size}px`, height: `${size}px` }"
    class="relative inline-flex shrink-0 items-center justify-center"
  >
    <!-- 柔光层：主题色径向模糊，营造光晕（仅 glow 时显示） -->
    <div v-if="glow" class="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-xl" />
    <a-avatar
      v-bind="$attrs"
      :size="size"
      class="!bg-primary !text-primary-foreground"
      :class="[ring && 'ring-2 ring-primary/30 ring-offset-4 ring-offset-background']"
    >
      <!-- 默认显示首字；调用方也可通过默认 slot 完全自定义内容 -->
      <template v-if="useDefaultContent">{{ fallbackText }}</template>
      <slot v-else />
    </a-avatar>
  </div>
</template>
