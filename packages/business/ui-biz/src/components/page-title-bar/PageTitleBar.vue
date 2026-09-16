<script lang="ts" setup>
  import { IconifyIcon } from '@vben-core/icons';

  defineOptions({ name: 'PageTitleBar' });

  /**
   * 页面标题栏（工作台子页统一形态）
   *
   * 形态：[返回按钮(左)] [功能名] [（商户/应用名称，灰色淡化）] [标签位] …… [右侧操作区由调用方插槽承载]
   * 用法：卡片页放在 `a-card` 的 `#title` 插槽内；PageShell 页由 PageShell 内部渲染。
   */
  withDefaults(
    defineProps<{
      /** 是否显示返回按钮（仅"有上级页"的子页传 true，一级菜单页不传） */
      back?: boolean;
      /** 商户名/应用名/通道商户名等，灰色淡化显示在功能名之后 */
      name?: string;
      /** 功能名（文案须与菜单 i18n_key 一致） */
      title: string;
      /** 窄屏允许换行完整展示名称（名称较长且页面宽度受限时传 true） */
      wrap?: boolean;
    }>(),
    {
      back: false,
      name: '',
      wrap: false,
    },
  );

  const emit = defineEmits<{ back: [] }>();
</script>

<template>
  <div :class="wrap ? 'flex flex-wrap items-center gap-x-2 gap-y-1' : 'flex items-center gap-2'">
    <!-- 返回上级页 -->
    <a-button
      v-if="back"
      type="text"
      class="flex items-center justify-center rounded-full hover:bg-accent"
      @click="emit('back')"
    >
      <template #icon>
        <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
      </template>
    </a-button>
    <!-- 功能名 -->
    <span class="text-lg font-bold text-foreground">{{ title }}</span>
    <!-- 商户名/应用名：灰色淡化 -->
    <span v-if="name" class="text-sm text-muted-foreground">({{ name }})</span>
    <!-- 标签位（如"默认应用""产品类型"等） -->
    <slot />
  </div>
</template>
