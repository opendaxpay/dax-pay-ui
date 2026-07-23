<script lang="ts" setup>
  import { computed } from 'vue';

  import { preferences } from '@vben/preferences';

  import { $t } from '#/locales';

  import { AuthPageLayout } from './authentication';

  const appName = computed(() => preferences.app.name);
  const logo = computed(() => preferences.logo.source);
  const logoDark = computed(() => preferences.logo.sourceDark);
</script>

<template>
  <!-- 国际化：安全、稳定、高效的支付运营解决方案 -->
  <!-- 国际化：DaxPay 支付运营管理平台 -->
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
    :logo-dark="logoDark"
    :page-description="$t('_core.authentication.pageDesc')"
    :page-title="$t('_core.authentication.pageTitle')"
  >
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
