<script lang="ts" setup>
  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  interface Props {
    /** 加载中(显示骨架屏) */
    loading?: boolean;
    /** 加载失败(显示错误占位 + 重试按钮) */
    error?: boolean;
    /** 无数据(显示空状态占位) */
    empty?: boolean;
    /** 空状态文案(默认走 i18n common.noData) */
    emptyText?: string;
    /** 内容区最小高度(默认 280px, 与 EchartsUI 高度匹配) */
    minHeight?: string;
    /** 骨架屏段落行数 */
    skeletonRows?: number;
  }

  withDefaults(defineProps<Props>(), {
    emptyText: '',
    error: false,
    empty: false,
    loading: false,
    minHeight: '280px',
    skeletonRows: 6,
  });

  defineEmits<{ retry: [] }>();

  defineOptions({ name: 'ChartCard' });
</script>

<template>
  <a-card variant="borderless" class="!h-full !bg-card" :style="{ minHeight }">
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <template v-if="$slots.extra" #extra>
      <slot name="extra" />
    </template>

    <a-skeleton v-if="loading" active :paragraph="{ rows: skeletonRows }" />
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center gap-2 py-6"
      :style="{ minHeight }"
    >
      <IconifyIcon icon="ant-design:warning-outlined" class="text-foreground/40 size-10" />
      <p class="text-foreground/60 text-sm">{{ $t('common.loadFailed') }}</p>
      <a-button size="small" type="primary" @click="$emit('retry')">
        {{ $t('common.retry') }}
      </a-button>
    </div>
    <a-empty
      v-else-if="empty"
      :description="emptyText || $t('common.noData')"
      class="!my-10"
    />
    <slot v-else />
  </a-card>
</template>
