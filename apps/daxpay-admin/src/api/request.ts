/**
 * 该文件可自行根据业务逻辑进行调整
 */
import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

import { createDaxRequestClient } from '@daxpay/ui-biz/request';
import { useAuthStore } from '#/store';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

/**
 * 重新认证逻辑（端特定：依赖本 app 的 useAuthStore）
 */
async function doReAuthenticate() {
  console.warn('Access token is invalid or expired.');
  const accessStore = useAccessStore();
  const authStore = useAuthStore();
  accessStore.setAccessToken(null);
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
