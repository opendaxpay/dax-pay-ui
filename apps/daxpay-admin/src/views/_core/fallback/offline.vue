<script lang="ts" setup>
  import { onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

import { Fallback } from '@vben/common-ui';
import { decodeSafeRedirect } from '@vben/utils';

  import { AuthApi } from '#/api/core/auth.api';
  import { $t } from '#/locales';
  import { HOME_PATH } from '#/router/routes';

  defineOptions({ name: 'FallbackOfflineDemo' });

  const route = useRoute();
  const router = useRouter();

  // 读取重试后应跳转的路径：优先使用进入本页时记录的原页面（query.redirect），否则回首页
  function getRedirectPath(): string {
    const redirect = route.query.redirect;
    return decodeSafeRedirect(redirect, HOME_PATH);
  }

  // 重试连接: 回到原页面重新走认证流程
  // (后端已恢复则正常进入系统, 仍不可用则由守卫重新跳回本页, 不会死循环)
  function retry() {
    router.replace(getRedirectPath());
  }

  // 进入页面即探测后端是否已恢复（修复 F5 整体刷新不生效：offline 路由属 coreRoute
  // 白名单，守卫直接放行不再发请求，故需在此主动探测一次认证链路）
  // 后端已恢复则回原页面让守卫重新走认证流程；仍不可用则静默停留
  onMounted(async () => {
    try {
      await AuthApi.getPermCodes();
      router.replace(getRedirectPath());
    } catch {
      // 后端仍不可用，留在本页等待用户手动重试
    }
  });
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
