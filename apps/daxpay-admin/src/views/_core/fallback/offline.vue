<script lang="ts" setup>
  import { Fallback } from '@vben/common-ui';
  import { useRouter } from 'vue-router';

  import { $t } from '#/locales';
  import { HOME_PATH } from '#/router/routes';

  defineOptions({ name: 'FallbackOfflineDemo' });

  const router = useRouter();

  // 重试连接: 跳回首页重新走认证流程
  // (后端已恢复则正常进入系统, 仍不可用则由守卫重新跳回本页, 不会死循环)
  function retry() {
    router.replace(HOME_PATH);
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
