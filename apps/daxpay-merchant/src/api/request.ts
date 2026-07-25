/**
 * 该文件可自行根据业务逻辑进行调整
 */
import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

import { createDaxRequestClient } from '@daxpay/ui-biz/request';

import { useSensitiveDataCleanup } from '#/hooks/useSensitiveDataCleanup';
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

const { requestClient, defHttp } = createDaxRequestClient({
  baseURL: apiURL,
  doReAuthenticate,
});

export { defHttp, requestClient };
