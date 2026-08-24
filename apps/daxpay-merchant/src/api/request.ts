/**
 * 该文件可自行根据业务逻辑进行调整
 */
import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';
import { decodeSafeRedirect } from '@vben/utils';

import { createDaxRequestClient } from '@daxpay/ui-biz/request';

import { useSensitiveDataCleanup } from '#/hooks/useSensitiveDataCleanup';
import { FORCE_CHANGE_PASSWORD_PATH } from '#/router/routes';
import { useAuthStore } from '#/store';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
const { clearOnSessionEnd } = useSensitiveDataCleanup();

/**
 * 重新认证逻辑（端特定：依赖本 app 的 useAuthStore）
 */
async function doReAuthenticate() {
  console.warn('Access token is invalid or expired.');
  const accessStore = useAccessStore();
  const authStore = useAuthStore();
  accessStore.setAccessToken(null);
  // 登录过期清除调试功能保存的敏感凭证(生产模式生效)
  clearOnSessionEnd();
  if (preferences.app.loginExpiredMode === 'modal' && accessStore.isAccessChecked) {
    accessStore.setLoginExpired(true);
  } else {
    await authStore.logout();
  }
}

/**
 * 初始密码/密码过期被拦截(40301/40302)时跳转强制改密页
 *
 * 用 location 硬跳而非 router: request.ts 处于模块依赖底层, 引 router 会造成循环依赖;
 * 硬刷新后路由守卫会重新拉取用户信息与密码状态, 行为等价于 F5 进入。
 */
function getCurrentRoutePath(): string {
  if (import.meta.env.VITE_ROUTER_HISTORY === 'hash') {
    const hash = window.location.hash;
    return hash.startsWith('#/') ? hash.slice(1) : '';
  }
  return `${window.location.pathname}${window.location.search}`;
}

function onPasswordExpired() {
  const currentPath = decodeSafeRedirect(getCurrentRoutePath());
  if (currentPath === FORCE_CHANGE_PASSWORD_PATH || currentPath.startsWith(`${FORCE_CHANGE_PASSWORD_PATH}?`)) {
    return;
  }

  const query = currentPath && currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : '';
  if (import.meta.env.VITE_ROUTER_HISTORY === 'hash') {
    window.location.hash = `#${FORCE_CHANGE_PASSWORD_PATH}${query}`;
  }
  else {
    window.location.href = `${FORCE_CHANGE_PASSWORD_PATH}${query}`;
  }
}

const { requestClient, defHttp } = createDaxRequestClient({
  baseURL: apiURL,
  doReAuthenticate,
  onPasswordExpired,
});

export { defHttp, requestClient };
