import type { AnyFunction } from '@vben/types';

import { useMagicKeys, whenever } from '@vueuse/core';

import { preferences, usePreferences } from '@vben/preferences';

/**
 * 锁屏与退出的全局快捷键
 * - Alt+L：打开锁屏弹窗
 * - Alt+Q：退出登录
 */
export function useLockShortcut(callbacks: {
  onLock: AnyFunction;
  onLogout: AnyFunction;
}) {
  const { globalLockScreenShortcutKey, globalLogoutShortcutKey } =
    usePreferences();

  // 快捷键总开关关闭时不注册任何监听
  if (!preferences.shortcutKeys.enable) {
    return;
  }

  const keys = useMagicKeys();
  const logoutKey = keys['Alt+KeyQ'];
  const lockKey = keys['Alt+KeyL'];

  if (logoutKey) {
    whenever(logoutKey, () => {
      // 仅在退出快捷键开关开启时触发
      if (globalLogoutShortcutKey.value) {
        callbacks.onLogout();
      }
    });
  }

  if (lockKey) {
    whenever(lockKey, () => {
      // 仅在锁屏快捷键开关开启时触发
      if (globalLockScreenShortcutKey.value) {
        callbacks.onLock();
      }
    });
  }
}
