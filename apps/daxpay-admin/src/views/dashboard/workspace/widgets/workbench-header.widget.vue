<script lang="ts" setup>
  import type { DashboardData } from '../types';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';
  import { useUserStore } from '@vben/stores';

  import { UserAvatar } from '#/components/user-avatar';

  interface Props {
    /** 工作台聚合数据（含统计计数与加载态） */
    data?: DashboardData;
  }

  defineOptions({ name: 'WorkbenchHeaderWidget' });

  const props = withDefaults(defineProps<Props>(), {
    data: undefined,
  });

  const userStore = useUserStore();

  // 时段问候语：早 / 午 / 晚
  const greetingKey = computed(() => {
    const hour = new Date().getHours();
    if (hour < 9) return 'dashboard.workspace.greeting.morning';
    if (hour < 18) return 'dashboard.workspace.greeting.afternoon';
    return 'dashboard.workspace.greeting.evening';
  });

  const userName = computed(() => userStore.userInfo?.name || '');

  // 头部核心统计项（与 data.stats 对齐）
  const statItems = computed(() => {
    const stats = props.data?.stats;
    return [
      // 商户总数
      { label: $t('dashboard.workspace.stat.merchantCount'), value: stats?.merchantCount ?? 0 },
      // 通道商户数
      { label: $t('dashboard.workspace.stat.channelMerchantCount'), value: stats?.channelMerchantCount ?? 0 },
      // 用户总数
      { label: $t('dashboard.workspace.stat.userCount'), value: stats?.userCount ?? 0 },
    ];
  });
</script>

<template>
  <div class="card-box flex flex-col gap-4 p-5 py-6 lg:flex-row lg:items-center">
    <div class="flex items-center">
      <UserAvatar :text="userName" :size="72" ring />
      <div class="ml-5 flex flex-col justify-center">
        <h1 class="text-lg font-semibold md:text-xl"> {{ $t(greetingKey) }}，{{ userName }} </h1>
        <span class="text-foreground/70 mt-1 text-sm">
          {{ $t('dashboard.workspace.greeting.subtitle') }}
        </span>
      </div>
    </div>

    <div class="flex flex-1 justify-end gap-6 md:gap-10">
      <template v-if="data?.loading">
        <a-skeleton v-for="i in 3" :key="i" active :paragraph="{ rows: 1 }" class="!w-16" />
      </template>
      <template v-else>
        <div v-for="item in statItems" :key="item.label" class="flex min-w-[56px] flex-col items-center justify-center">
          <span class="text-foreground/60 text-xs">{{ item.label }}</span>
          <span class="text-primary mt-1 text-2xl font-semibold tabular-nums">{{ item.value }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* 头像首字放大: antd 默认按 size 自动算字号偏小, 这里提到 32px 并加粗, 与统计数值风格一致 */
:deep(.ant-avatar-string) {
  font-size: 32px !important;
  font-weight: 600;
}
</style>
