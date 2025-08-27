<template>
  <ConfigProvider :locale="zhCN" :theme="themeConfig">
    <AppProvider>
      <RouterView />
    </AppProvider>
  </ConfigProvider>
</template>

<script lang="ts" setup>
  import { AppProvider } from '@/components/Application'
  import { useTitle } from '@/hooks/web/useTitle'
  import { ConfigProvider } from 'ant-design-vue'
  import zhCN from 'ant-design-vue/es/locale/zh_CN'

  import { useDarkModeTheme } from '@/hooks/setting/useDarkModeTheme'
  import 'dayjs/locale/zh-cn'
  import { computed } from 'vue'

  const { isDark, darkTheme } = useDarkModeTheme()

  const themeConfig = computed(() =>
    Object.assign(
      {
        token: {
          colorPrimary: '#0960bd',
          colorSuccess: '#55D187',
          colorWarning: '#EFBD47',
          colorError: '#ED6F6F',
          colorInfo: '#0960bd',
        },
      },
      isDark.value ? darkTheme : {},
    ),
  )
  useTitle()
</script>
