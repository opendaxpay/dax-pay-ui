<script lang="ts" setup>
  import type { QuickEntryMeta } from './types';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  defineOptions({ name: 'QuickEntryCard' });

  withDefaults(defineProps<Props>(), {
    editable: true,
  });

  const emit = defineEmits<{
    /** 点击编辑按钮 */
    edit: [];
    /** 点击某个入口磁贴（跳转路由由调用方处理） */
    select: [entry: QuickEntryMeta];
  }>();

  interface Props {
    /** 是否显示编辑按钮 */
    editable?: boolean;
    /** 已按权限过滤的入口序列 */
    entries: QuickEntryMeta[];
  }

</script>

<template>
  <a-card variant="borderless" class="!bg-card">
    <template #title>
      <span>{{ $t('dashboard.workspace.widget.quickEntry') }}</span>
    </template>
    <template #extra>
      <a-button v-if="editable" type="link" size="small" @click="emit('edit')">
        <IconifyIcon icon="lucide:settings-2" class="mr-1 size-4" />
        <span>{{ $t('dashboard.workspace.quickEntry.edit') }}</span>
      </a-button>
    </template>

    <div class="grid grid-cols-4 gap-2 md:grid-cols-8">
      <div
        v-for="entry in entries"
        :key="entry.key"
        class="hover:bg-accent flex cursor-pointer flex-col items-center gap-2 rounded-lg p-3 transition-colors"
        @click="emit('select', entry)"
      >
        <div
          :class="entry.color"
          class="text-background flex size-11 items-center justify-center rounded-lg shadow-sm"
        >
          <IconifyIcon :icon="entry.icon" class="size-5" />
        </div>
        <span class="text-foreground/80 line-clamp-1 text-center text-xs">{{
          $t(entry.titleKey)
        }}</span>
      </div>
    </div>
    <a-empty
      v-if="entries.length === 0"
      :description="$t('dashboard.workspace.quickEntry.empty')"
      class="!my-4"
    />
  </a-card>
</template>
