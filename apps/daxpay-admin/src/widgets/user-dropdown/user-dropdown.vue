<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { BookOpenText, LockKeyhole, LogOut, UserRoundPen } from '@vben/icons';
  import { $t } from '@vben/locales';
  import { preferences, usePreferences } from '@vben/preferences';
  import { useAccessStore } from '@vben/stores';
  import { isWindowsOs, openWindow } from '@vben/utils';

  import { UserAvatar } from '#/components/user-avatar';
  import { useMessage } from '#/hooks/useMessage';

  import LockModal from './lock-modal.vue';
  import { useLockShortcut } from './use-lock-shortcut';

  interface Props {
    /** 用户名（取首字作为头像） */
    text?: string;
  }

  withDefaults(defineProps<Props>(), {
    text: '',
  });

  const emit = defineEmits<{ logout: [] }>();

  // 项目文档地址（文档跳转至此）
  const DOC_URL = 'https://doc.daxpay.cn';

  const router = useRouter();
  const accessStore = useAccessStore();
  const { confirm } = useMessage();
  const { globalLockScreenShortcutKey, globalLogoutShortcutKey } = usePreferences();

  const lockModalOpen = ref(false);
  // 下拉菜单展开状态（点击菜单项后需手动收起）
  const dropdownOpen = ref(false);

  // 平台判断：Windows 显示 Alt，其它平台显示 ⌥
  const altView = computed(() => (isWindowsOs() ? 'Alt' : '⌥'));
  // 是否开启锁屏功能
  const enableLockScreen = computed(() => preferences.widget.lockScreen);
  // 是否展示快捷键提示
  const showLockShortcut = computed(() => preferences.shortcutKeys.enable && globalLockScreenShortcutKey.value);
  const showLogoutShortcut = computed(() => preferences.shortcutKeys.enable && globalLogoutShortcutKey.value);

  /** 跳转个人设置 */
  function goProfile() {
    router.push({ name: 'Profile' });
  }

  /** 打开文档 */
  function openDocs() {
    openWindow(DOC_URL, { target: '_blank' });
  }

  /** 打开锁屏密码弹窗 */
  function openLockModal() {
    lockModalOpen.value = true;
  }

  /** 锁屏密码提交：设置锁屏状态，触发全屏遮罩渲染 */
  function handleLockSubmit(password: string) {
    accessStore.lockScreen(password);
  }

  /** 退出登录：二次确认后触发 logout 事件 */
  function handleLogout() {
    confirm({
      title: $t('common.prompt'),
      content: $t('ui.widgets.logoutTip'),
      okType: 'danger',
      onOk: () => {
        emit('logout');
      },
    });
  }

  /** 菜单项点击统一处理 */
  function handleMenuClick(info: { key: string }) {
    switch (info.key) {
      case 'docs': {
        openDocs();
        break;
      }
      case 'lock': {
        openLockModal();
        break;
      }
      case 'logout': {
        handleLogout();
        break;
      }
      case 'profile': {
        goProfile();
        break;
      }
    }
    // 点击任意菜单项后收起下拉菜单
    dropdownOpen.value = false;
  }

  // 注册全局快捷键（Alt+L 锁屏 / Alt+Q 退出）
  useLockShortcut({
    onLock: openLockModal,
    onLogout: handleLogout,
  });
</script>

<template>
  <LockModal v-if="enableLockScreen" v-model:open="lockModalOpen" :text="text" @submit="handleLockSubmit" />

  <a-dropdown v-model:open="dropdownOpen" :trigger="['click']" placement="bottomRight">
    <div class="ml-1 mr-2 cursor-pointer rounded-full p-1.5 hover:bg-accent">
      <div class="flex items-center justify-center hover:text-accent-foreground">
        <UserAvatar :text="text" :size="32" />
      </div>
    </div>
    <template #popupRender>
      <a-menu @click="handleMenuClick">
        <!-- 顶部用户信息（不可点击） -->
        <a-menu-item key="user-info" disabled class="!cursor-default !text-foreground">
          <div class="flex items-center gap-2">
            <UserAvatar :text="text" :size="36" />
            <span class="text-sm font-medium">{{ text }}</span>
          </div>
        </a-menu-item>
        <a-menu-divider />
        <!-- 个人设置 -->
        <a-menu-item key="profile">
          <div class="flex items-center">
            <UserRoundPen class="mr-2 size-4" />
            <span>{{ $t('page.auth.profile') }}</span>
          </div>
        </a-menu-item>
        <!-- 文档 -->
        <a-menu-item key="docs">
          <div class="flex items-center">
            <BookOpenText class="mr-2 size-4" />
            <span>{{ $t('ui.widgets.document') }}</span>
          </div>
        </a-menu-item>
        <!-- 锁定屏幕 -->
        <template v-if="enableLockScreen">
          <a-menu-divider />
          <a-menu-item key="lock">
            <div class="flex items-center">
              <LockKeyhole class="mr-2 size-4" />
              <span>{{ $t('ui.widgets.lockScreen.title') }}</span>
              <span v-if="showLockShortcut" class="ml-auto pl-4 text-xs text-gray-400"> {{ altView }} L </span>
            </div>
          </a-menu-item>
        </template>
        <a-menu-divider />
        <!-- 退出登录 -->
        <a-menu-item key="logout">
          <div class="flex items-center">
            <LogOut class="mr-2 size-4" />
            <span>{{ $t('common.logout') }}</span>
            <span v-if="showLogoutShortcut" class="ml-auto pl-4 text-xs text-gray-400"> {{ altView }} Q </span>
          </div>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>
