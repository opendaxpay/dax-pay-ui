<script lang="ts" setup>
  import type { NotificationItem } from '@vben/layouts';

  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  import { useWatermark } from '@vben/hooks';
  import { BasicLayout, Notification } from '@vben/layouts';
  import { $t } from '@vben/locales';
  import { preferences } from '@vben/preferences';
  import { useAccessStore, useUserStore } from '@vben/stores';
  import { formatDateTime } from '@vben/utils';

  import { MdPreview } from 'md-editor-v3';

  import { LoginExpiredModal } from '#/components/login-expired-modal';
  import { TimezonePicker } from '#/components/timezone';
  import { useMessage } from '#/hooks/useMessage';
  import { HOME_PATH } from '#/router/routes';
  import { useAuthStore } from '#/store';
  import { useNotifyStore } from '#/store/notify';
  import LoginForm from '#/views/_core/authentication/login.vue';
  import { LockScreen, UserDropdown } from '#/widgets/user-dropdown';

  import 'md-editor-v3/lib/style.css';
  import 'md-editor-v3/lib/preview.css';

  const notifyStore = useNotifyStore();
  const { message } = useMessage();

  // 铃铛"查看正文"弹窗
  const detailOpen = ref(false);
  const detail = ref<NotificationItem>();

  // 通知项(公告 + 个人消息), 适配铃铛组件结构
  const notifications = computed<NotificationItem[]>(() =>
    notifyStore.list.map((item) => ({
      date: formatDateTime(item.createTime),
      id: item.id!,
      isRead: item.isRead,
      link: item.link,
      message: item.message ?? '',
      severity: item.severity,
      title: item.title ?? '',
      type: item.type,
    })),
  );

  const router = useRouter();
  const userStore = useUserStore();
  const authStore = useAuthStore();
  const accessStore = useAccessStore();
  const { destroyWatermark, updateWatermark } = useWatermark();

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
    // 直接跳首页常量，避免经 "/" 的 redirect 受 preferences 缓存污染
    router.push(HOME_PATH);
  }

  // 铃铛"查看全部" → 通知中心
  function handleViewAll() {
    router.push('/notify/center');
  }

  async function handleLogout() {
    await authStore.logout(false);
  }

  // 根据id查原始通知项(取type)
  function findBrief(id: number | string) {
    return notifyStore.list.find((item) => item.id === id);
  }

  function markRead(id: number | string) {
    const brief = findBrief(id);
    if (brief?.type && brief.id) {
      notifyStore.markRead(brief.type, brief.id);
      message.success($t('system.notify.markReadSuccess'));
    }
  }

  // 点击铃铛通知项查看正文(查看即标记已读)
  function handleView(item: NotificationItem) {
    detail.value = item;
    detailOpen.value = true;
    if (!item.isRead && item.type && item.id) {
      notifyStore.markRead(item.type, String(item.id));
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
    message.success($t('system.notify.readAllSuccess'));
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
    <template #timezone>
      <TimezonePicker />
    </template>
    <template #notification>
      <Notification
        :count="notifyStore.unreadCount"
        :notifications="notifications"
        @read="(item) => item.id && markRead(item.id)"
        @remove="(item) => item.id && remove(item.id)"
        @make-all="handleMakeAll"
        @view="handleView"
        @view-all="handleViewAll"
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
  <!-- 铃铛通知正文查看弹窗 -->
  <a-modal :open="detailOpen" :title="detail?.title" :footer="null" width="800" @cancel="detailOpen = false">
    <MdPreview v-if="detail" :model-value="detail.message ?? ''" />
  </a-modal>
</template>
