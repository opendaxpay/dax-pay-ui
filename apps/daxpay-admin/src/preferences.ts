import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    accessMode: 'backend',
    name: 'DaxPay Admin',
    defaultHomePath: '/workspace',
  },
  logo: {
    enable: true,
    source: '/logo.png',
    sourceDark: '/logo-dark.png',
    fit: 'contain',
  },
  breadcrumb: {
    showHome: true,
  },
  copyright: {
    enable: false,
  },
  sidebar: {
    width: 266,
    fixedButton: false,
  },
  tabbar: {
    middleClickToClose: true,
    persist: false,
  },
  shortcutKeys: {
    // 默认关闭全局快捷键提示（Alt+Q 退出 / Alt+L 锁屏），避免用户下拉菜单出现裸快捷键文案
    globalLogout: false,
    globalLockScreen: false,
  },
  theme: {
    mode: 'auto',
    builtinType: 'default',
    colorPrimary: 'hsl(212 100% 45%)',
  },
  widget: {
    timezone: true,
  },
});
