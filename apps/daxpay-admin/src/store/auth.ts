import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { AuthApi, TWO_FACTOR_REQUIRED_CODE } from '#/api/core/auth.api';
import { UserCommonApi } from '#/api/core/user.api';
import { useMessage } from '#/hooks/useMessage';
import { $t } from '#/locales';
import { encryptPassword } from '#/utils/rsa-encrypt';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  // 双因素认证挑战状态
  const twoFactorRequired = ref(false);
  const twoFactorPreAuthToken = ref('');

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
      const loginResult = await AuthApi.login({
        account: params.account,
        client: 'admin',
        loginType: 'password',
        password: encryptedPassword,
        // 验证码参数（登录失败达阈值后必传）
        captchaKey: params.captchaKey,
        captchaCode: params.captchaCode,
      });

      // 双因素认证挑战: 密码通过但需二次验证, 记录预认证令牌并切到验证界面
      if (loginResult.code === TWO_FACTOR_REQUIRED_CODE) {
        twoFactorPreAuthToken.value = (loginResult.data as any)?.preAuthToken ?? '';
        twoFactorRequired.value = true;
        return { userInfo: null };
      }

      const accessToken = loginResult.data;
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

  /**
   * 双因素认证二次验证, 凭预认证令牌 + 动态码/备用码完成登录
   */
  async function twoFactorVerify(code: string, codeType: string = 'TOTP') {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { data: accessToken } = await AuthApi.secondVerify({
        preAuthToken: twoFactorPreAuthToken.value,
        code,
        codeType,
      });
      if (accessToken) {
        accessStore.setAccessToken(accessToken);
        userInfo = await fetchUserInfo();
        userStore.setUserInfo(userInfo!);
        // 清除 2FA 挑战状态
        twoFactorRequired.value = false;
        twoFactorPreAuthToken.value = '';
        await router.push(preferences.app.defaultHomePath);
        if (userInfo?.name) {
          const { notification } = useMessage();
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}: ${userInfo.name}`,
            duration: 3,
            title: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }
    return { userInfo };
  }

  /**
   * 取消双因素认证(返回登录表单)
   */
  function cancelTwoFactor() {
    twoFactorRequired.value = false;
    twoFactorPreAuthToken.value = '';
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
    cancelTwoFactor,
    fetchUserInfo,
    loginLoading,
    logout,
    twoFactorPreAuthToken,
    twoFactorRequired,
    twoFactorVerify,
  };
});
