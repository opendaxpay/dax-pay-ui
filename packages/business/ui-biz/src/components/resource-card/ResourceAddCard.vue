<script lang="ts" setup>
  /**
   * 资源卡片墙的「新增」召唤卡(通用)
   * 规格与实体资源卡同尺寸(156px / 16px 圆角), 实线边框 + 56px 图标块 + 粗体文案,
   * hover 上浮并染主色; 键盘 Enter/Space 与资源卡一致。
   */
  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  defineOptions({ name: 'ResourceAddCard' });

  withDefaults(
    defineProps<{
      /** 图标名, 默认加号 */
      icon?: string;
      /** 文案, 如「新增门店」 */
      text?: string;
    }>(),
    {
      icon: 'ant-design:plus-outlined',
      // 默认「新增」, 走框架通用词条(多语)
      text: $t('common.create'),
    },
  );

  const emit = defineEmits<{
    click: [];
  }>();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      emit('click');
    }
  }
</script>

<template>
  <div
    class="add-card group flex h-full min-h-[156px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border bg-card text-muted-foreground shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
    role="button"
    tabindex="0"
    :aria-label="text"
    @click="emit('click')"
    @keydown="handleKeydown"
  >
    <div
      class="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10"
    >
      <IconifyIcon :icon="icon" class="h-7 w-7" />
    </div>
    <span class="text-sm font-bold">{{ text }}</span>
  </div>
</template>
