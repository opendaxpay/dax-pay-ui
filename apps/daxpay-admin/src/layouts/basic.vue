<script lang="ts" setup>
  import type { NotificationItem } from '@vben/layouts';

  import { computed, onMounted, onUnmounted, watch } from 'vue';
  import { useRouter } from 'vue-router';

  import { useWatermark } from '@vben/hooks';
  import { BasicLayout, Notification } from '@vben/layouts';
  import { preferences } from '@vben/preferences';
  import { useAccessStore, useUserStore } from '@vben/stores';

  import { LoginExpiredModal } from '#/components/login-expired-modal';
  import { useAuthStore } from '#/store';
  import { useNotifyStore } from '#/store/notify';
  import LoginForm from '#/views/_core/authentication/login.vue';
  import { LockScreen, UserDropdown } from '#/widgets/user-dropdown';

  const notifyStore = useNotifyStore();

  // 通知项(公告 + 个人消息), 适配铃铛组件结构
  const notifications = computed<NotificationItem[]>(() =>
    notifyStore.list.map((item) => ({
      avatar: 'https://avatar.vercel.sh/notify.svg',
      date: item.createTime ?? '',
      id: item.id!,
      isRead: item.isRead,
      link: item.link,
      message: item.message ?? '',
      title: item.title ?? '',
    })),
  );

  const router = useRouter();
  const userStore = useUserStore();
  const authStore = useAuthStore();
  const accessStore = useAccessStore();
  const { destroyWatermark, updateWatermark } = useWatermark();
  const showDot = computed(() => notifyStore.unreadCount > 0);

  // 登录后拉取通知并建立 SSE 实时连接
  onMounted(() => {
    notifyStore.refresh().catch(() => {});
    notifyStore.connectSSE();
  });

  // 离开布局断开 SSE
  onUnmounted(() => {
    notifyStore.disconnectSSE();
  });

  function handleLogoClick() {
    router.push('/');
  }

  async function handleLogout() {
    await authStore.logout(false);
  }

  // 清空 = 全部已读
  function handleNoticeClear() {
    notifyStore.markAllRead();
  }

  // 根据id查原始通知项(取type)
  function findBrief(id: number | string) {
    return notifyStore.list.find((item) => item.id === id);
  }

  function markRead(id: number | string) {
    const brief = findBrief(id);
    if (brief?.type && brief.id) {
      notifyStore.markRead(brief.type, brief.id);
    }
  }

  function remove(id: number | string) {
    const brief = findBrief(id);
    if (brief?.type && brief.id) {
      notifyStore.ignore(brief.type, brief.id);
    }
  }

  function handleMakeAll() {
    notifyStore.markAllRead();
  }
  watch(
    () => ({
      enable: preferences.app.watermark,
      content: preferences.app.watermarkContent,
    }),
    async ({ enable, content }) => {
      if (enable) {
        await updateWatermark({
          content: content || `${userStore.userInfo?.account} - ${userStore.userInfo?.name}`,
        });
      } else {
        destroyWatermark();
      }
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <BasicLayout @click-logo="handleLogoClick" @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown :text="userStore.userInfo?.name" @logout="handleLogout" />
    </template>
    <template #notification>
      <Notification
        :dot="showDot"
        :notifications="notifications"
        @clear="handleNoticeClear"
        @read="(item) => item.id && markRead(item.id)"
        @remove="(item) => item.id && remove(item.id)"
        @make-all="handleMakeAll"
      />
    </template>
    <template #extra>
      <LoginExpiredModal v-model:open="accessStore.loginExpired" :text="userStore.userInfo?.name">
        <LoginForm />
      </LoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :text="userStore.userInfo?.name" @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
