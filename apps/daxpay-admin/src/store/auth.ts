import type { Recordable, UserInfo } from '@vben/types';

import type { PasswordStatus } from '#/api/core/user.api';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';
import { decodeSafeRedirect } from '@vben/utils';

import { startAuthentication } from '@simplewebauthn/browser';
import { defineStore } from 'pinia';

import { AuthApi, TWO_FACTOR_REQUIRED_CODE } from '#/api/core/auth.api';
import { PasskeyApi } from '#/api/core/passkey.api';
import { UserCommonApi } from '#/api/core/user.api';
import { CLIENT_CODE } from '#/constants/client';
import { useMessage } from '#/hooks/useMessage';
import { useSensitiveDataCleanup } from '#/hooks/useSensitiveDataCleanup';
import { $t } from '#/locales';
import { FORCE_CHANGE_PASSWORD_PATH, HOME_PATH } from '#/router/routes';
import { encryptPassword } from '#/utils/rsa-encrypt';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();
  const { clearOnSessionEnd } = useSensitiveDataCleanup();

  const loginLoading = ref(false);

  // 是否处于二次验证
  const twoFactorRequired = ref(false);
  const twoFactorPreAuthToken = ref('');

  // 密码状态(初始密码/过期标记), 登录后拉取用户信息时更新
  const passwordStatus = ref<null | PasswordStatus>(null);

  // 是否需要强制修改密码(初始密码或已过期)
  const needChangePassword = computed(
    () => passwordStatus.value?.initialPassword === true || passwordStatus.value?.expired === true,
  );

  /** 获取强制改密后的安全回跳地址 */
  function getForceChangePasswordRoute() {
    const redirectPath = decodeSafeRedirect(router.currentRoute.value.query.redirect, HOME_PATH);
    if (redirectPath === HOME_PATH) {
      return { path: FORCE_CHANGE_PASSWORD_PATH };
    }
    return {
      path: FORCE_CHANGE_PASSWORD_PATH,
      query: { redirect: encodeURIComponent(redirectPath) },
    };
  }

  /**
   * 异步处理登录操作
   * @param params 登录表单数据
   * @param onSuccess
   */
  async function authLogin(params: Recordable<any>, onSuccess?: () => Promise<void> | void) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      // 对密码进行 RSA 加密
      const encryptedPassword = await encryptPassword(params.password);
      // 登录协议对齐后端真实接口, 避免命中 Mock 参数结构
      const loginResult = await AuthApi.login({
        account: params.account,
        client: CLIENT_CODE,
        loginType: 'password',
        password: encryptedPassword,
        // 验证码参数（登录失败达阈值后必传）
        captchaKey: params.captchaKey,
        captchaCode: params.captchaCode,
      });

      // 密码通过但需二次验证: 记录临时凭证并切到验证界面
      if (loginResult.code === TWO_FACTOR_REQUIRED_CODE) {
        enterTwoFactor((loginResult.data as any)?.preAuthToken ?? '');
        return { userInfo: null };
      }

      const accessToken = loginResult.data;
      if (accessToken) {
        accessStore.setAccessToken(accessToken);

        const userInfoResult = await fetchUserInfo();

        userInfo = userInfoResult;
        userStore.setUserInfo(userInfo!);

        if (needChangePassword.value) {
          // 初始密码/密码过期: 登录后强制跳改密页, 不进入系统
          await router.replace(getForceChangePasswordRoute());
        } else if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          await (onSuccess ? onSuccess?.() : router.push(HOME_PATH));
        }

        if (userInfo?.name && !needChangePassword.value) {
          const { notification } = useMessage();
          notification.success({
            // 登录成功描述
            description: `${$t('authentication.loginSuccessDesc')}: ${userInfo.name}`,
            duration: 3,
            // 登录成功
            title: $t('authentication.loginSuccess'),
          });
        }
        notifyPasswordExpiringSoon();
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  /**
   * 通行密钥登录(discoverable 免输账号, 系统弹窗选择凭据)
   * 验证通过后不再叠加 TOTP 两步验证(后端按登录类型豁免), 成功链路与密码登录一致
   */
  async function passkeyLogin() {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      // 第一步: 获取认证选项(挑战)
      const { data: optionsData } = await PasskeyApi.loginOptions(CLIENT_CODE);
      if (!optionsData) {
        return { userInfo };
      }
      // 第二步: 唤起系统凭据选择弹窗(用户取消会抛错, 由外层统一提示)
      const credential = await startAuthentication({
        optionsJSON: optionsData.options,
      });
      // 第三步: 提交断言验证换取 token
      const { data: accessToken } = await PasskeyApi.loginVerify({
        client: CLIENT_CODE,
        challengeId: optionsData.challengeId,
        credentialJson: JSON.stringify(credential),
      });
      if (accessToken) {
        accessStore.setAccessToken(accessToken);
        userInfo = await fetchUserInfo();
        userStore.setUserInfo(userInfo!);
        await router.replace(needChangePassword.value ? getForceChangePasswordRoute() : { path: HOME_PATH });
        if (userInfo?.name && !needChangePassword.value) {
          const { notification } = useMessage();
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}: ${userInfo.name}`,
            duration: 3,
            title: $t('authentication.loginSuccess'),
          });
        }
        notifyPasswordExpiringSoon();
      }
    } finally {
      loginLoading.value = false;
    }
    return { userInfo };
  }

  /**
   * 二次验证: 临时凭证 + 动态码/备用码完成登录
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
        // 清除二次验证状态
        twoFactorRequired.value = false;
        twoFactorPreAuthToken.value = '';
        // 初始密码/密码过期: 二次验证通过后同样强制跳改密页
        await router.replace(needChangePassword.value ? getForceChangePasswordRoute() : { path: HOME_PATH });
        if (userInfo?.name && !needChangePassword.value) {
          const { notification } = useMessage();
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}: ${userInfo.name}`,
            duration: 3,
            title: $t('authentication.loginSuccess'),
          });
        }
        notifyPasswordExpiringSoon();
      }
    } finally {
      loginLoading.value = false;
    }
    return { userInfo };
  }

  /**
   * 进入二次验证(密码登录或社交登录回调共用)
   */
  function enterTwoFactor(preAuthToken: string) {
    twoFactorPreAuthToken.value = preAuthToken ?? '';
    twoFactorRequired.value = true;
  }

  /**
   * 取消二次验证(返回登录表单)
   */
  function cancelTwoFactor() {
    twoFactorRequired.value = false;
    twoFactorPreAuthToken.value = '';
  }

  async function logout(redirect: boolean = true) {
    await AuthApi.logout();
    // 清除Token存储
    accessStore.clearTokenFromStorage();
    // 登出时清除调试功能保存的敏感凭证(生产模式生效)
    clearOnSessionEnd();
    // 清除密码状态
    passwordStatus.value = null;
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
    const { data } = await UserCommonApi.getUserInfo();
    // 保存密码状态(初始密码/过期标记), 供登录跳转与路由守卫强制改密判断
    passwordStatus.value = data?.passwordStatus ?? null;
    const userInfo = {
      account: data?.account ?? '',
      avatar: data?.avatar ?? '',
      id: data?.id ?? '',
      name: data?.name ?? '',
    } as UserInfo;
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  /** 登录成功后提示密码即将过期 */
  function notifyPasswordExpiringSoon() {
    if (!passwordStatus.value?.expiringSoon || needChangePassword.value) {
      return;
    }
    const { notification } = useMessage();
    notification.warning({
      // 密码即将过期提示
      description: $t('_core.authentication.passwordExpiringSoon'),
      duration: 6,
      title: $t('common.warning'),
    });
  }

  function $reset() {
    loginLoading.value = false;
    passwordStatus.value = null;
  }

  return {
    $reset,
    authLogin,
    cancelTwoFactor,
    enterTwoFactor,
    fetchUserInfo,
    getForceChangePasswordRoute,
    loginLoading,
    logout,
    needChangePassword,
    notifyPasswordExpiringSoon,
    passkeyLogin,
    passwordStatus,
    twoFactorPreAuthToken,
    twoFactorRequired,
    twoFactorVerify,
  };
});
