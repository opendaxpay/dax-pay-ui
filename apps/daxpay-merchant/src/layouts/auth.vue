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
  <!-- 国际化：一站式收款、对账与经营管理(商户端定位, 勿回退成运营端文案) -->
  <!-- 国际化：DaxPay 商户服务平台 -->
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
