<script setup lang="ts">
  import type { BasicUserInfo } from '@vben/types';

  import { UserAvatar } from '#/components/user-avatar';

  interface Props {
    /** 用户信息 */
    userInfo: BasicUserInfo | null;
    /** 侧边栏标签页配置 */
    tabs: {
      label: string;
      value: string;
    }[];
    /** 标题（保留兼容，当前模板未渲染） */
    title?: string;
  }

  defineOptions({
    name: 'UserProfile',
  });

  withDefaults(defineProps<Props>(), {
    title: '',
  });

  // 当前激活的标签页（v-model:model-value）
  const activeKey = defineModel<string>('modelValue');
</script>

<template>
  <div class="flex size-full">
    <!-- 左侧：头像 + 用户名 + 账号 + 垂直标签页 -->
    <a-card class="w-1/6 flex-none" :bordered="false">
      <div class="mt-4 flex h-40 flex-col items-center justify-center gap-4">
        <UserAvatar :text="userInfo?.name ?? ''" :size="80" />
        <span class="text-lg font-semibold">
          {{ userInfo?.name ?? '' }}
        </span>
        <span class="text-sm text-foreground/80">
          {{ userInfo?.account ?? '' }}
        </span>
      </div>
      <a-divider class="my-4" />
      <a-tabs v-model:active-key="activeKey" tab-position="left" class="user-profile-tabs">
        <a-tab-pane v-for="tab in tabs" :key="tab.value" :tab="tab.label" />
      </a-tabs>
    </a-card>
    <!-- 右侧：标签页内容 -->
    <a-card class="ml-4 w-5/6 flex-auto p-8" :bordered="false">
      <slot name="content"></slot>
    </a-card>
  </div>
</template>

<style scoped>
  /* 左侧标签页：撑满卡片宽度，激活项高亮主题色 */
  .user-profile-tabs :deep(.ant-tabs) {
    width: 100%;
  }
</style>
