<script lang="ts" setup>
  import { computed } from 'vue';

  import { preferences } from '@vben/preferences';

  import { $t } from '#/locales';

  // 品牌名走站点配置(getRawSystemName), 词条用 {name} 插值, 与小程序端品牌插值化方案对齐
  import { getRawSystemName } from '#/logics/init-website-config';

  import { AuthPageLayout } from './authentication';

  const appName = computed(() => preferences.app.name);
  const logo = computed(() => preferences.logo.source);
  const logoDark = computed(() => preferences.logo.sourceDark);
  // 登录页大标题: 词条 {name} 占位符注入站点配置的裸品牌名
  const pageTitle = computed(() => $t('_core.authentication.pageTitle', { name: getRawSystemName() }));
</script>

<template>
  <!-- 国际化：安全、稳定、高效的支付运营解决方案 -->
  <!-- 国际化：{name} 支付运营管理平台(品牌名读站点配置) -->
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
    :logo-dark="logoDark"
    :page-description="$t('_core.authentication.pageDesc')"
    :page-title="pageTitle"
  >
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
