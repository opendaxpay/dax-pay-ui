<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';
  import { useAccessStore } from '@vben/stores';

  import { TWO_FACTOR_REQUIRED_CODE } from '#/api/core/auth.api';
  import { SocialApi } from '#/api/iam/social.api';
  import { SocialLogo } from '#/components/social';
  import { CLIENT_CODE } from '#/constants/client';
  import { useMessage } from '#/hooks/useMessage';
  import { HOME_PATH } from '#/router/routes';
  import { useAuthStore } from '#/store';

  import TwoFactorVerifyPanel from './components/TwoFactorVerifyPanel.vue';

  defineOptions({ name: 'OauthCallback' });

  const route = useRoute();
  const router = useRouter();
  const { message } = useMessage();
  const accessStore = useAccessStore();
  const authStore = useAuthStore();

  // 是否展示页内 2FA 面板(社交登录触发挑战)
  const showTwoFactor = ref(false);

  // 路径参数中的平台编码(如 gitee), 可能为空(旧地址兼容)
  const source = computed(() => (route.params.source as string) || '');

  // 平台显示名, 走 i18n(翻译缺失时回退到原始 source 编码)
  const platformName = computed(() => {
    if (!source.value) {
      return '';
    }
    return $t(`iam.social.platform.${source.value}`);
  });

  // loading 提示文案, 有平台时显示"xxx 授权处理中..."
  const processingTip = computed(() => {
    if (platformName.value) {
      return $t('_core.authentication.oauthProcessingWith', {
        platform: platformName.value,
      });
    }
    return $t('_core.authentication.oauthProcessing');
  });

  /**
   * 处理社交登录回调(仅登录场景)
   * 支付宝回传 auth_code, 标准 OAuth 回传 code; 归一后统一走 SocialApi.exchangeLogin
   * 若返回 40101 则进入双因素验证(与密码登录同协议)
   */
  onMounted(async () => {
    const { code, auth_code: authCode, state } = route.query;
    // 支付宝回传 auth_code, 标准 OAuth 回传 code
    const oauthCode = (authCode || code) as string | undefined;
    if (!oauthCode || !state) {
      message.error($t('_core.authentication.oauthProcessFailed'));
      router.push('/auth/login');
      return;
    }
    try {
      const res = await SocialApi.exchangeLogin(oauthCode, state as string, source.value, CLIENT_CODE);
      // 双因素挑战: 拦截器对 40101 返回 body, 不当 reject
      if (res.code === TWO_FACTOR_REQUIRED_CODE) {
        const preAuthToken = (res.data as any)?.preAuthToken ?? '';
        authStore.enterTwoFactor(preAuthToken);
        showTwoFactor.value = true;
        return;
      }
      await handleResult(res.data?.token, res.data?.error);
    } catch {
      message.error($t('_core.authentication.oauthProcessFailed'));
      router.push('/auth/login');
    }
  });

  /**
   * 统一处理登录兑换结果
   * - token: 登录成功, 存储令牌并跳转首页
   * - error=unbind: 未绑定三方账号, 引导回登录页
   * - error=state_invalid: 授权状态过期
   * - error=oauth_failed: 授权失败
   */
  async function handleResult(token?: string, error?: string) {
    if (token) {
      accessStore.setAccessToken(token);
      await authStore.fetchUserInfo();
      message.success(
        platformName.value
          ? $t('_core.authentication.oauthLoginSuccessWith', {
              platform: platformName.value,
            })
          : $t('_core.authentication.oauthLoginSuccess'),
      );
      router.push(HOME_PATH);
    } else if (error === 'unbind') {
      message.error($t('_core.authentication.oauthNotBind'));
      router.push('/auth/login');
    } else if (error === 'state_invalid') {
      message.error($t('_core.authentication.oauthStateInvalid'));
      router.push('/auth/login');
    } else {
      message.error(
        platformName.value
          ? $t('_core.authentication.oauthFailedWith', {
              platform: platformName.value,
            })
          : $t('_core.authentication.oauthFailed'),
      );
      router.push('/auth/login');
    }
  }

  /**
   * 取消 2FA: 回登录页
   */
  function handleTwoFactorCancel() {
    authStore.cancelTwoFactor();
    showTwoFactor.value = false;
    router.push('/auth/login');
  }
</script>

<template>
  <div class="flex h-screen w-full flex-col items-center justify-center gap-4">
    <!-- 社交登录触发 2FA: 页内二次验证 -->
    <template v-if="showTwoFactor || authStore.twoFactorRequired">
      <SocialLogo v-if="source" :source="source" :size="48" />
      <div class="w-full max-w-sm rounded-lg bg-background p-6 shadow">
        <div class="mb-4 text-center text-lg font-medium">
          {{ $t('_core.authentication.twoFactor.title') }}
        </div>
        <TwoFactorVerifyPanel />
        <!-- 取消时回登录(覆盖面板默认 cancel 仅清状态) -->
        <div class="mt-2 text-center">
          <a-button type="link" size="small" @click="handleTwoFactorCancel">
            {{ $t('common.back') }}
          </a-button>
        </div>
      </div>
    </template>
    <template v-else>
      <!-- 平台图标(有 source 时显示, 强化用户感知) -->
      <SocialLogo v-if="source" :source="source" :size="56" />
      <a-spin size="large" :description="processingTip" />
    </template>
  </div>
</template>
