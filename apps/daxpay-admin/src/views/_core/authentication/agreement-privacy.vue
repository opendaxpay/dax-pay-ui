<script lang="ts" setup>
  import { $t } from '@vben/locales';

  import { AuthPageCard } from './components';

  defineOptions({ name: 'AgreementPrivacy' });
</script>

<template>
  <!-- 国际化：隐私政策 -->
  <AuthPageCard :title="$t('authentication.privacyTitle')">
    <!-- 占位提示，后续替换为正式协议内容 -->
    <a-alert :message="$t('authentication.agreementContentPlaceholder')" type="info" show-icon />
  </AuthPageCard>
</template>
