<script lang="ts" setup>
  import { useRoute, useRouter } from 'vue-router';

  import { Fallback } from '@vben/common-ui';

  import { $t } from '#/locales';
  import { HOME_PATH } from '#/router/routes';

  defineOptions({ name: 'FallbackOfflineDemo' });

  const route = useRoute();
  const router = useRouter();

  // 读取重试后应跳转的路径：优先使用进入本页时记录的原页面（query.redirect），否则回首页
  function getRedirectPath(): string {
    const redirect = route.query.redirect;
    return redirect ? decodeURIComponent(redirect as string) : HOME_PATH;
  }

  // 重试连接: 回到原页面重新走认证流程
  // (后端已恢复则正常进入系统, 仍不可用则由守卫重新跳回本页, 不会死循环)
  function retry() {
    router.replace(getRedirectPath());
  }
</script>

<template>
  <Fallback status="offline">
    <template #action>
      <a-button type="primary" size="large" @click="retry">
        {{ $t('common.refresh') }}
      </a-button>
    </template>
  </Fallback>
</template>
