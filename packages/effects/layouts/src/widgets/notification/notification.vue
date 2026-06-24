<script lang="ts" setup>
import type { NotificationItem } from './types';

import { useRouter } from 'vue-router';

import { Bell, CircleCheckBig, Inbox, MailCheck } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  VbenButton,
  VbenIconButton,
  VbenPopover,
  VbenScrollbar,
} from '@vben-core/shadcn-ui';

import { useToggle } from '@vueuse/core';

interface Props {
  /**
   * 未读数(显示为铃铛角标, >99 显示 99+)
   */
  count?: number;
  /**
   * 消息列表
   */
  notifications?: NotificationItem[];
}

defineOptions({ name: 'NotificationPopup' });

withDefaults(defineProps<Props>(), {
  count: 0,
  notifications: () => [],
});

const emit = defineEmits<{
  makeAll: [];
  read: [NotificationItem];
  remove: [NotificationItem];
  view: [NotificationItem];
  viewAll: [];
}>();

const router = useRouter();
const [open, toggle] = useToggle();

function close() {
  open.value = false;
}

function handleViewAll() {
  emit('viewAll');
  close();
}

function handleMakeAll() {
  emit('makeAll');
}

function handleClick(item: NotificationItem) {
  // 有链接则跳转, 否则触发查看正文
  if (item.link) {
    navigateTo(item.link, item.query, item.state);
  } else {
    emit('view', item);
  }
}

function navigateTo(
  link: string,
  query?: Record<string, any>,
  state?: Record<string, any>,
) {
  if (link.startsWith('http://') || link.startsWith('https://')) {
    // 外部链接，在新标签页打开
    window.open(link, '_blank');
  } else {
    // 内部路由链接，支持 query 参数和 state
    router.push({
      path: link,
      query: query || {},
      state,
    });
  }
}
</script>
<template>
  <VbenPopover v-model:open="open" content-class="relative right-2 w-90 p-0">
    <template #trigger>
      <div class="mr-2 flex-center h-full" @click.stop="toggle()">
        <VbenIconButton class="bell-button relative text-foreground">
          <span
            v-if="count && count > 0"
            class="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium leading-4 text-primary-foreground"
          >
            {{ count > 99 ? '99+' : count }}
          </span>
          <Bell class="size-4" />
        </VbenIconButton>
      </div>
    </template>

    <div class="relative">
      <div class="flex items-center justify-between px-4 py-1">
        <div class="text-foreground">{{ $t('ui.widgets.notifications') }}</div>
        <VbenIconButton
          :disabled="notifications.length <= 0"
          :tooltip="$t('ui.widgets.markAllAsRead')"
          @click="handleMakeAll"
        >
          <MailCheck class="size-4" />
        </VbenIconButton>
      </div>
      <VbenScrollbar v-if="notifications.length > 0">
        <ul class="flex! max-h-90 w-full flex-col">
          <template v-for="item in notifications" :key="item.id ?? item.title">
            <li
              class="relative flex w-full cursor-pointer items-start gap-5 border-t border-border px-3 py-2 hover:bg-accent"
              @click="handleClick(item)"
            >
              <span
                class="relative flex size-10 shrink-0 items-center justify-center rounded-full"
                :class="
                  item.type === 'message'
                    ? 'bg-blue-500/15 text-blue-500'
                    : 'bg-emerald-500/15 text-emerald-500'
                "
              >
                <Inbox v-if="item.type === 'message'" class="size-5" />
                <Bell v-else class="size-5" />
              </span>
              <div class="flex min-w-0 flex-1 flex-col gap-1 pr-12 leading-none">
                <p
                  class="truncate font-semibold"
                  :class="{ 'text-red-500': item.severity === 'important' }"
                >
                  {{ item.title }}
                </p>
                <p class="line-clamp-2 text-xs text-muted-foreground">
                  {{ item.date }}
                </p>
              </div>
              <div
                class="absolute top-1/2 right-3 flex -translate-y-1/2 flex-col gap-2"
              >
                <VbenIconButton
                  v-if="!item.isRead"
                  size="xs"
                  variant="ghost"
                  class="h-6 px-2"
                  :tooltip="$t('common.confirm')"
                  @click.stop="emit('read', item)"
                >
                  <CircleCheckBig class="size-4" />
                </VbenIconButton>
              </div>
            </li>
          </template>
        </ul>
      </VbenScrollbar>

      <template v-else>
        <div class="flex-center min-h-37.5 w-full text-muted-foreground">
          {{ $t('common.noData') }}
        </div>
      </template>

      <div class="flex items-center justify-end border-t border-border px-4 py-1">
        <VbenButton size="sm" @click="handleViewAll">
          {{ $t('ui.widgets.viewAll') }}
        </VbenButton>
      </div>
    </div>
  </VbenPopover>
</template>

<style scoped>
:deep(.bell-button) {
  &:hover {
    svg {
      animation: bell-ring 1s both;
    }
  }
}

@keyframes bell-ring {
  0%,
  100% {
    transform-origin: top;
  }

  15% {
    transform: rotateZ(10deg);
  }

  30% {
    transform: rotateZ(-10deg);
  }

  45% {
    transform: rotateZ(5deg);
  }

  60% {
    transform: rotateZ(-5deg);
  }

  75% {
    transform: rotateZ(2deg);
  }
}
</style>
