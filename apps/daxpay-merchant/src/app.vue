<script lang="ts" setup>
  import { computed } from 'vue';

  import { useAntdDesignTokens } from '@vben/hooks';
  import { preferences, usePreferences } from '@vben/preferences';

  import { App, ConfigProvider, theme } from 'antdv-next';

  import AntdAppProvider from '#/components/AntdAppProvider.vue';
  import { antdLocale } from '#/locales';

  defineOptions({ name: 'App' });

  const { isDark } = usePreferences();
  const { tokens } = useAntdDesignTokens();

  const tokenTheme = computed(() => {
    const algorithm = isDark.value ? [theme.darkAlgorithm] : [theme.defaultAlgorithm];

    // antd 紧凑模式算法
    if (preferences.app.compact) {
      algorithm.push(theme.compactAlgorithm);
    }

    return {
      algorithm,
      token: tokens,
      components: {
        // antdv-next 尺寸体系(sizeUnit=4/sizeStep=4)下 iconGap 默认跟随 marginXS=8px,
        // 按钮内文字与图标(如操作列「更多 ⌄」)间隔明显偏大, 收紧为 antd 生态惯例的 4px
        Button: { iconGap: 4 },
      },
    };
  });
</script>

<template>
  <ConfigProvider :locale="antdLocale" :theme="tokenTheme">
    <App>
      <AntdAppProvider>
        <RouterView />
      </AntdAppProvider>
    </App>
  </ConfigProvider>
</template>
