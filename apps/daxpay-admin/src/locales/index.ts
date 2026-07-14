// @ts-ignore
import type { Locale } from 'antdv-next/dist/locale';

import type { App } from 'vue';

import type { LocaleSetupOptions, SupportedLanguagesType } from '@vben/locales';

import { ref } from 'vue';

import { $t, setupI18n as coreSetup, loadLocalesMapFromDir } from '@vben/locales';
import { preferences } from '@vben/preferences';

import antdEnLocale from 'antdv-next/dist/locale/en_US';
import antdJaLocale from 'antdv-next/dist/locale/ja_JP';
import antdKoLocale from 'antdv-next/dist/locale/ko_KR';
import antdHkLocale from 'antdv-next/dist/locale/zh_HK';
import antdTwLocale from 'antdv-next/dist/locale/zh_TW';
import antdDefaultLocale from 'antdv-next/dist/locale/zh_CN';
import dayjs from 'dayjs';
import { VxeUI } from 'vxe-table';

// 菜单标题包：在 loadMessages 内并入，避免与 menu.api 循环依赖；与 injectMenuI18n 同源
import enUsMenuTitles from './menu-titles/en-US.json';
import jaJpMenuTitles from './menu-titles/ja-JP.json';
import koKrMenuTitles from './menu-titles/ko-KR.json';
import zhCnMenuTitles from './menu-titles/zh-CN.json';
import zhHkMenuTitles from './menu-titles/zh-HK.json';
import zhTwMenuTitles from './menu-titles/zh-TW.json';

const antdLocale = ref<Locale>(antdDefaultLocale);

const modules = import.meta.glob('./langs/**/*.json');

const localesMap = loadLocalesMapFromDir(/\.\/langs\/([^/]+)\/(.*)\.json$/, modules);

/** 按完整 locale 取菜单标题（flat key），不注入短码 zh，防止繁体回退简体 */
function getMenuTitlesFor(lang: SupportedLanguagesType): Record<string, string> {
  switch (lang) {
    case 'en-US': {
      return enUsMenuTitles as Record<string, string>;
    }
    case 'zh-TW': {
      return zhTwMenuTitles as Record<string, string>;
    }
    case 'zh-HK': {
      return zhHkMenuTitles as Record<string, string>;
    }
    case 'ja-JP': {
      return jaJpMenuTitles as Record<string, string>;
    }
    case 'ko-KR': {
      return koKrMenuTitles as Record<string, string>;
    }
    case 'zh-CN':
    default: {
      return zhCnMenuTitles as Record<string, string>;
    }
  }
}

/**
 * 加载应用特有的语言包
 * 每次语言切换都会走这里：业务 langs + menu-titles 一并 merge，
 * 避免 setLocaleMessage 冲掉登录时 inject 的菜单标题后回退到错误语种
 * @param lang
 */
async function loadMessages(lang: SupportedLanguagesType) {
  const [appLocaleMessages] = await Promise.all([localesMap[lang]?.(), loadThirdPartyMessage(lang)]);
  const base = (appLocaleMessages?.default ?? {}) as Record<string, unknown>;
  // 菜单标题真相源：menu-titles/{lang}.json，与 injectMenuI18n 同源
  return {
    ...base,
    ...getMenuTitlesFor(lang),
  };
}

/**
 * 加载第三方组件库的语言包
 * @param lang
 */
async function loadThirdPartyMessage(lang: SupportedLanguagesType) {
  await Promise.all([loadAntdLocale(lang), loadDayjsLocale(lang), loadVxeLocale(lang)]);
}

/**
 * 加载dayjs的语言包
 * @param lang
 */
async function loadDayjsLocale(lang: SupportedLanguagesType) {
  let locale;
  switch (lang) {
    case 'en-US': {
      locale = await import('dayjs/locale/en');
      break;
    }
    case 'zh-CN': {
      locale = await import('dayjs/locale/zh-cn');
      break;
    }
    case 'zh-TW': {
      locale = await import('dayjs/locale/zh-tw');
      break;
    }
    case 'zh-HK': {
      locale = await import('dayjs/locale/zh-hk');
      break;
    }
    case 'ja-JP': {
      locale = await import('dayjs/locale/ja');
      break;
    }
    case 'ko-KR': {
      locale = await import('dayjs/locale/ko');
      break;
    }
    default: {
      locale = await import('dayjs/locale/zh-cn');
    }
  }
  if (locale) {
    dayjs.locale(locale);
  } else {
    console.error(`Failed to load dayjs locale for ${lang}`);
  }
}

/**
 * 加载antd的语言包
 * @param lang
 */
async function loadAntdLocale(lang: SupportedLanguagesType) {
  switch (lang) {
    case 'en-US': {
      antdLocale.value = antdEnLocale;
      break;
    }
    case 'zh-CN': {
      antdLocale.value = antdDefaultLocale;
      break;
    }
    case 'zh-TW': {
      antdLocale.value = antdTwLocale;
      break;
    }
    case 'zh-HK': {
      antdLocale.value = antdHkLocale;
      break;
    }
    case 'ja-JP': {
      antdLocale.value = antdJaLocale;
      break;
    }
    case 'ko-KR': {
      antdLocale.value = antdKoLocale;
      break;
    }
  }
}

/**
 * 加载vxe-table的语言包
 * @param lang
 */
async function loadVxeLocale(lang: SupportedLanguagesType) {
  switch (lang) {
    case 'en-US': {
      VxeUI.setLanguage('en-US');
      break;
    }
    case 'zh-CN': {
      VxeUI.setLanguage('zh-CN');
      break;
    }
    case 'zh-TW': {
      VxeUI.setLanguage('zh-TW');
      break;
    }
    case 'zh-HK': {
      VxeUI.setLanguage('zh-HK');
      break;
    }
    case 'ja-JP': {
      VxeUI.setLanguage('ja-JP');
      break;
    }
    case 'ko-KR': {
      VxeUI.setLanguage('ko-KR');
      break;
    }
  }
}

async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  await coreSetup(app, {
    defaultLocale: preferences.app.locale,
    loadMessages,
    missingWarn: !import.meta.env.PROD,
    ...options,
  });
}

export { $t, antdLocale, setupI18n };
export { i18n } from '@vben/locales';
