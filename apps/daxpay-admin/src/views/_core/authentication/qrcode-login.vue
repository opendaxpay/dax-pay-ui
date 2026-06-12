<script lang="ts" setup>
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { AuthPageCard, AuthQrCodePanel } from './components';

  defineOptions({ name: 'QrCodeLogin' });

  const router = useRouter();

  /**
   * 返回登录页
   */
  function goBack() {
    router.push('/auth/login');
  }
</script>

<template>
  <AuthPageCard>
    <AuthQrCodePanel :show-title="true" />

    <a-button block class="mt-4" @click="goBack">
      <template #icon>
        <IconifyIcon icon="ant-design:left-outlined" />
      </template>
      {{ $t('common.back') }}
    </a-button>
  </AuthPageCard>
</template>
