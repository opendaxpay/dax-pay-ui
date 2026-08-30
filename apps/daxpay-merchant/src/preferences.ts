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
    // 仅纯品牌名; 端后缀('管理端'/'Admin')由 init-website-config.ts 用 i18n 拼接,
    // 避免模块加载期 i18n 字典未就绪 + 防止与后缀拼接产生双重后缀
    name: 'DaxPay',
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
    // 自定义主题:主色完全由 colorPrimary 驱动,避免内置预设在明暗切换时把主色重置回预设蓝
    builtinType: 'custom',
    // 商户端主色 #07c160,与商户端 App(theme.scss 的 --wot-color-theme)保持一致
    colorPrimary: 'hsl(149 93% 39%)',
  },
  widget: {
    timezone: true,
  },
});
