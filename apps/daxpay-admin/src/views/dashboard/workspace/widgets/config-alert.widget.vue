<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  import { ConfigCheckItem } from '#/api/payment/check/config-check.api';
  import { ConfigCheckApi } from '#/api/payment/check/config-check.api';

  interface Props {
    data?: DashboardData;
  }

  defineOptions({ name: 'ConfigAlertWidget' });

  withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  const router = useRouter();
  const loading = ref(false);
  const items = ref<ConfigCheckItem[]>([]);
  const totalCount = ref(0);

  // 分类图标映射(与后端 ConfigCheckCategoryEnum.code 对应)
  const categoryIconMap: Record<string, string> = {
    channelMerchant: 'lucide:store',
    mchApp: 'lucide:app-window',
    mchCredential: 'lucide:key-round',
    mchNotify: 'lucide:bell-ring',
    payProduct: 'lucide:credit-card',
    payRoute: 'lucide:route',
    platformOss: 'lucide:hard-drive',
    platformUrl: 'lucide:link',
    platformWebsite: 'lucide:globe',
    socialLogin: 'lucide:log-in',
  };

  function categoryIcon(category: string): string {
    return categoryIconMap[category] ?? 'lucide:alert-circle';
  }

  async function load() {
    loading.value = true;
    try {
      const { data } = await ConfigCheckApi.items();
      items.value = data?.items ?? [];
      totalCount.value = data?.totalCount ?? 0;
    } finally {
      loading.value = false;
    }
  }

  onMounted(load);

  // 全部配置已完成
  const isComplete = computed(() => totalCount.value === 0);

  // routeName 字段实际存储的是前端路由 path, 直接 push
  function navTo(routePath: string) {
    router.push(routePath).catch(() => {});
  }
</script>

<template>
  <a-card variant="borderless" class="!h-full !bg-card">
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon icon="lucide:list-checks" class="size-4 text-primary" />
        <span>{{ $t('dashboard.workspace.widget.configAlert') }}</span>
        <a-tag v-if="totalCount > 0" color="orange" class="!ml-1 !mr-0">
          {{ totalCount }}
        </a-tag>
      </div>
    </template>
    <template #extra>
      <a-button type="link" size="small" @click="load">
        <IconifyIcon icon="lucide:refresh-cw" class="mr-1 size-3.5" />
        <span>{{ $t('common.refresh') }}</span>
      </a-button>
    </template>

    <a-skeleton v-if="loading" active :paragraph="{ rows: 4 }" />

    <!-- 空状态: 全部已配置 -->
    <div v-else-if="isComplete" class="flex flex-col items-center justify-center py-6">
      <IconifyIcon icon="lucide:circle-check-big" class="mb-2 size-10 text-emerald-500" />
      <span class="text-sm text-foreground/60">{{ $t('dashboard.workspace.configAlert.allComplete') }}</span>
    </div>

    <!-- 未配置列表 -->
    <ul v-else class="alert-scroll flex max-h-[230px] flex-col gap-2 overflow-y-auto pr-1">
      <li
        v-for="item in items"
        :key="item.itemKey"
        class="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent"
        @click="navTo(item.routeName)"
      >
        <div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-500">
          <IconifyIcon :icon="categoryIcon(item.category)" class="size-4" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium">
            {{ $t(item.titleKey) }}
          </div>
          <div class="truncate text-xs text-foreground/50">
            {{ $t(item.descriptionKey) }}
          </div>
        </div>
        <a-tag v-if="item.count !== undefined && item.count > 0" color="orange" class="!m-0 shrink-0">
          {{ item.count }}
        </a-tag>
        <IconifyIcon icon="lucide:chevron-right" class="size-4 shrink-0 text-foreground/30" />
      </li>
    </ul>
  </a-card>
</template>

<style scoped>
  .alert-scroll::-webkit-scrollbar {
    width: 4px;
  }
  .alert-scroll::-webkit-scrollbar-thumb {
    background-color: hsl(var(--border));
    border-radius: 2px;
  }
  .alert-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
</style>
