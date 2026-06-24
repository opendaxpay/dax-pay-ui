import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { AuthApi } from '#/api/core/auth.api';
import { UserCommonApi } from '#/api/core/user.api';
import { useMessage } from '#/hooks/useMessage';
import { $t } from '#/locales';
import { encryptPassword } from '#/utils/rsa-encrypt';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * @param params 登录表单数据
   * @param onSuccess
   */
  async function authLogin(params: Recordable<any>, onSuccess?: () => Promise<void> | void) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      // 中文注释：对密码进行RSA加密
      const encryptedPassword = await encryptPassword(params.password);
      // 中文注释：登录协议固定对齐后端真实接口，避免继续命中 Mock 参数结构。
      const { data: accessToken } = await AuthApi.login({
        account: params.account,
        client: 'admin',
        loginType: 'password',
        password: encryptedPassword,
        // 验证码参数（登录失败达阈值后必传）
        captchaKey: params.captchaKey,
        captchaCode: params.captchaCode,
      });

      if (accessToken) {
        accessStore.setAccessToken(accessToken);

        const userInfoResult = await fetchUserInfo();

        userInfo = userInfoResult;
        userStore.setUserInfo(userInfo!);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          await (onSuccess ? onSuccess?.() : router.push(preferences.app.defaultHomePath));
        }

        if (userInfo?.name) {
          const { notification } = useMessage();
          notification.success({
            // 登录成功描述
            description: `${$t('authentication.loginSuccessDesc')}: ${userInfo.name}`,
            duration: 3,
            // 登录成功
            title: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    await AuthApi.logout();
    // 清除Token存储
    accessStore.clearTokenFromStorage();
    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const { data: userInfo } = await UserCommonApi.getUserInfo();
    userStore.setUserInfo(userInfo!);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
