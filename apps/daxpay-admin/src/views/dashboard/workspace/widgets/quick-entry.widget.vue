<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  import QuickEntryEditDrawer from './quick-entry/quick-entry-edit.drawer.vue';
  import {
    DEFAULT_ENTRIES,
    resolveEntries,
  } from './quick-entry/catalog';
  import { usePermission } from '#/hooks/usePermission';
  import { useQuickEntryStore } from '#/store/quick-entry';

  interface Props {
    /** 工作台聚合数据（快捷入口不消费统计，保留以统一 widget props 契约） */
    data?: DashboardData;
  }

  defineOptions({ name: 'QuickEntryWidget' });

  // 快捷入口不消费聚合数据，保留 data prop 以统一 widget 渲染契约
  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  const router = useRouter();
  const quickEntryStore = useQuickEntryStore();
  const { hasPermission } = usePermission();

  // 编辑抽屉显隐
  const editVisible = ref(false);

  // 实际渲染序列：用户自定义 ?? 默认，按权限过滤
  const entries = computed(() => {
    const keys = quickEntryStore.entries ?? DEFAULT_ENTRIES;
    return resolveEntries(keys).filter((e) =>
      e.perms.some((p) => hasPermission(p)),
    );
  });

  /** 跳转到目标路由 */
  function navTo(routeName: string) {
    router.push({ name: routeName }).catch(() => {});
  }

  /** 打开编辑抽屉 */
  function openEdit() {
    editVisible.value = true;
  }

  /** 编辑保存后刷新本地缓存 */
  function handleSaved() {
    quickEntryStore.load(true);
  }

  onMounted(() => {
    // 进入工作台即加载当前用户偏好
    quickEntryStore.load();
  });
</script>

<template>
  <a-card variant="borderless" class="!bg-card">
    <template #title>
      <span>{{ $t('dashboard.workspace.widget.quickEntry') }}</span>
    </template>
    <template #extra>
      <a-button type="link" size="small" @click="openEdit">
        <IconifyIcon icon="lucide:settings-2" class="mr-1 size-4" />
        <span>{{ $t('dashboard.workspace.quickEntry.edit') }}</span>
      </a-button>
    </template>

    <div class="grid grid-cols-4 gap-2 md:grid-cols-8">
      <div
        v-for="entry in entries"
        :key="entry.key"
        class="hover:bg-accent flex cursor-pointer flex-col items-center gap-2 rounded-lg p-3 transition-colors"
        @click="navTo(entry.routeName)"
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

    <!-- 编辑抽屉 -->
    <QuickEntryEditDrawer v-model:open="editVisible" @saved="handleSaved" />
  </a-card>
</template>
