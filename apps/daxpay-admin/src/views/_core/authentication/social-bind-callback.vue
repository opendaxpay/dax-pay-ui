<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';

  import { $t } from '@vben/locales';

  import { AlipayAuthApi, SocialApi } from '#/api/iam/social.api';

  defineOptions({ name: 'SocialBindCallback' });

  const route = useRoute();

  const loading = ref(true);
  const success = ref(false);
  const errorMessage = ref('');

  /** 路径参数中的平台编码 */
  const source = computed(() => (route.params.source as string) || '');

  /** 平台显示名 */
  const platformName = computed(() => {
    if (!source.value) return '';
    return $t(`iam.social.platform.${source.value}`);
  });

  /** 加载提示 */
  const processingTip = computed(() => {
    if (platformName.value) {
      return `${platformName.value} ${$t('_core.authentication.oauthProcessing')}`;
    }
    return $t('_core.authentication.oauthProcessing');
  });

  /**
   * 处理绑定回调: 用授权码+state 调后端兑换, 成功后通知父窗口并关闭弹窗
   * 支付宝回传 auth_code, 标准 OAuth 回传 code
   */
  onMounted(async () => {
    const { code, auth_code: authCode, state } = route.query;
    const oauthCode = (authCode || code) as string | undefined;
    if (!oauthCode || !state || !source.value) {
      loading.value = false;
      errorMessage.value = $t('_core.authentication.oauthFailed');
      return;
    }
    try {
      const res =
        source.value === 'alipay'
          ? await AlipayAuthApi.exchange(oauthCode, state as string, 'admin', 'BIND')
          : await SocialApi.exchangeBind(oauthCode, state as string, source.value, 'admin');
      if (res.data?.result === 'bind_success') {
        success.value = true;
        loading.value = false;
        // 通知父窗口刷新绑定列表
        window.opener?.postMessage({ type: 'social_bind_success', source: source.value }, '*');
        // 延迟关闭, 让用户看到成功提示
        setTimeout(() => window.close(), 800);
      } else if (res.data?.error) {
        loading.value = false;
        errorMessage.value = mapError(res.data.error);
      }
    } catch {
      loading.value = false;
      errorMessage.value = $t('_core.authentication.oauthFailed');
    }
  });

  function mapError(error: string): string {
    const map: Record<string, string> = {
      oauth_failed: $t('_core.authentication.oauthFailed'),
      state_invalid: $t('_core.authentication.oauthStateInvalid'),
    };
    return map[error] || $t('_core.authentication.oauthFailed');
  }

  function closeWindow() {
    window.close();
  }
</script>

<template>
  <div class="flex h-screen w-full flex-col items-center justify-center gap-4">
    <!-- 加载中 -->
    <template v-if="loading">
      <a-spin size="large" :description="processingTip" />
    </template>
    <!-- 成功 -->
    <template v-else-if="success">
      <a-result status="success" :title="$t('_core.authentication.oauthBindSuccess')" />
    </template>
    <!-- 失败 -->
    <template v-else>
      <a-result status="error" :title="$t('_core.authentication.oauthFailed')">
        <template #extra>
          <a-button @click="closeWindow">{{ $t('common.close') }}</a-button>
        </template>
      </a-result>
    </template>
  </div>
</template>
