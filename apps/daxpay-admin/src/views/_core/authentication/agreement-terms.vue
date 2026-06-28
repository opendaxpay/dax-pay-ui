<script lang="ts" setup>
  import { $t } from '@vben/locales';

  import { AuthPageCard } from './components';

  defineOptions({ name: 'AgreementTerms' });
</script>

<template>
  <!-- 国际化：用户协议 -->
  <AuthPageCard :title="$t('authentication.termsTitle')">
    <!-- 占位提示，后续替换为正式协议内容 -->
    <a-alert :message="$t('authentication.agreementContentPlaceholder')" type="info" show-icon />
  </AuthPageCard>
</template>
