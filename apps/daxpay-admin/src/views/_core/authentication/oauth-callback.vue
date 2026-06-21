<script lang="ts" setup>
  import { computed, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';
  import { preferences } from '@vben/preferences';
  import { useAccessStore } from '@vben/stores';

  import { SocialApi } from '#/api/iam/social.api';
  import { SocialLogo } from '#/components/social';
  import { useMessage } from '#/hooks/useMessage';
  import { useAuthStore } from '#/store';

  defineOptions({ name: 'OauthCallback' });

  const route = useRoute();
  const router = useRouter();
  const { message } = useMessage();
  const accessStore = useAccessStore();
  const authStore = useAuthStore();

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
   * 处理社交登录回调
   * 新流程: URL 含 code+state → 调 exchange API → 后端返回 JSON 结果
   * 旧兼容: URL 直接含 token/error/result → 原地处理
   */
  onMounted(async () => {
    const { code, state, token, error, result } = route.query;
    try {
      if (code && state) {
        // 新流程: 前端回调模式, 用 code+state 调后端兑换
        const res = await SocialApi.exchange(code as string, state as string);
        await handleResult(res.data?.token, res.data?.result, res.data?.error);
      } else {
        // 旧兼容: 后端 302 重定向模式, 直接从 URL 读参数
        await handleResult(token as string | undefined, result as string | undefined, error as string | undefined);
      }
    } catch {
      message.error($t('_core.authentication.oauthProcessFailed'));
      router.push('/auth/login');
    }
  });

  /**
   * 统一处理兑换结果
   * - token: 登录成功, 存储令牌并跳转首页
   * - result=bind_success: 绑定成功, 跳转个人中心
   * - error=unbind: 未绑定三方账号, 引导回登录页
   * - error=state_invalid: 授权状态过期
   * - error=oauth_failed: 授权失败
   */
  async function handleResult(token?: string, result?: string, error?: string) {
    if (token) {
      accessStore.setAccessToken(token, true);
      await authStore.fetchUserInfo();
      message.success(
        platformName.value
          ? $t('_core.authentication.oauthLoginSuccessWith', {
              platform: platformName.value,
            })
          : $t('_core.authentication.oauthLoginSuccess'),
      );
      router.push(preferences.app.defaultHomePath);
    } else if (result === 'bind_success') {
      message.success($t('_core.authentication.oauthBindSuccess'));
      router.push('/profile');
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
</script>

<template>
  <div class="flex h-screen w-full flex-col items-center justify-center gap-4">
    <!-- 平台图标(有 source 时显示, 强化用户感知) -->
    <SocialLogo v-if="source" :source="source" :size="56" />
    <a-spin size="large" :tip="processingTip" />
  </div>
</template>
