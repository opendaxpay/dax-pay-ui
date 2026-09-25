<script lang="ts" setup>
  import type { QuickEntryMeta } from '@daxpay/ui-biz/components/quick-entry';

  import type { DashboardData } from '../types';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { QuickEntryCard, QuickEntryEditDrawer, resolveCatalogEntries } from '@daxpay/ui-biz/components/quick-entry';

  import { usePermission } from '#/hooks/usePermission';
  import { useQuickEntryStore } from '#/store/quick-entry';

  import { DEFAULT_ENTRIES, ENTRY_CATALOG } from './quick-entry/catalog';

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

  // 实际渲染序列：用户自定义 ?? 默认，按权限过滤（空 perms 表示登录即可访问）
  const entries = computed(() => {
    const keys = quickEntryStore.entries ?? DEFAULT_ENTRIES;
    return resolveCatalogEntries(ENTRY_CATALOG, keys).filter(
      (e) => e.perms.length === 0 || e.perms.some((p) => hasPermission(p)),
    );
  });

  /** 跳转到目标路由 */
  function navTo(entry: QuickEntryMeta) {
    router.push({ name: entry.routeName }).catch(() => {});
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
  <QuickEntryCard :entries="entries" @edit="editVisible = true" @select="navTo" />

  <!-- 编辑抽屉 -->
  <QuickEntryEditDrawer
    v-model:open="editVisible"
    :catalog="ENTRY_CATALOG"
    :store="quickEntryStore"
    @saved="handleSaved"
  />
</template>
