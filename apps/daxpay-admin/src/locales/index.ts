// @ts-ignore
import type { Locale } from 'antdv-next/dist/locale';

import type { App } from 'vue';

import type {
  LocaleMessageValue,
  LocaleSetupOptions,
  SupportedLanguagesType,
} from '@vben/locales';

import { ref } from 'vue';

import { $t, setupI18n as coreSetup, loadLocalesMapFromDir } from '@vben/locales';
import { preferences } from '@vben/preferences';

import antdEnLocale from 'antdv-next/dist/locale/en_US';
import antdIdLocale from 'antdv-next/dist/locale/id_ID';
import antdJaLocale from 'antdv-next/dist/locale/ja_JP';
import antdKoLocale from 'antdv-next/dist/locale/ko_KR';
import antdMsLocale from 'antdv-next/dist/locale/ms_MY';
import antdThLocale from 'antdv-next/dist/locale/th_TH';
import antdViLocale from 'antdv-next/dist/locale/vi_VN';
import antdHkLocale from 'antdv-next/dist/locale/zh_HK';
import antdTwLocale from 'antdv-next/dist/locale/zh_TW';
import antdDefaultLocale from 'antdv-next/dist/locale/zh_CN';
import dayjs from 'dayjs';
import { VxeUI } from 'vxe-table';

// 菜单标题包：在 loadMessages 内并入，避免与 menu.api 循环依赖；与 injectMenuI18n 同源
import enUsMenuTitles from './menu-titles/en-US.json';
import idIdMenuTitles from './menu-titles/id-ID.json';
import jaJpMenuTitles from './menu-titles/ja-JP.json';
import koKrMenuTitles from './menu-titles/ko-KR.json';
import msMyMenuTitles from './menu-titles/ms-MY.json';
import thThMenuTitles from './menu-titles/th-TH.json';
import viVnMenuTitles from './menu-titles/vi-VN.json';
import zhCnMenuTitles from './menu-titles/zh-CN.json';
import zhHkMenuTitles from './menu-titles/zh-HK.json';
import zhTwMenuTitles from './menu-titles/zh-TW.json';

// 顶层 flat key: 供 packages/@core/ui-kit/popup-ui 等框架组件 fallback 使用
// (框架组件用 $t('cancel')/$t('confirm')/$t('expand')/$t('collapse') 无命名空间)
// 不走 langs/ 目录(keyPath 会带文件名前缀),由 loadMessages 直接展开到顶层
import enUsFlat from './flat/en-US.json';
import idIdFlat from './flat/id-ID.json';
import jaJpFlat from './flat/ja-JP.json';
import koKrFlat from './flat/ko-KR.json';
import msMyFlat from './flat/ms-MY.json';
import thThFlat from './flat/th-TH.json';
import viVnFlat from './flat/vi-VN.json';
import zhCnFlat from './flat/zh-CN.json';
import zhHkFlat from './flat/zh-HK.json';
import zhTwFlat from './flat/zh-TW.json';

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
    case 'id-ID': {
      return idIdMenuTitles as Record<string, string>;
    }
    case 'vi-VN': {
      return viVnMenuTitles as Record<string, string>;
    }
    case 'th-TH': {
      return thThMenuTitles as Record<string, string>;
    }
    case 'ms-MY': {
      return msMyMenuTitles as Record<string, string>;
    }
    case 'zh-CN':
    default: {
      return zhCnMenuTitles as Record<string, string>;
    }
  }
}

/** 按完整 locale 取顶层 flat key 包(框架组件 fallback 文案) */
function getFlatMessagesFor(lang: SupportedLanguagesType): Record<string, string> {
  switch (lang) {
    case 'en-US': {
      return enUsFlat as Record<string, string>;
    }
    case 'zh-TW': {
      return zhTwFlat as Record<string, string>;
    }
    case 'zh-HK': {
      return zhHkFlat as Record<string, string>;
    }
    case 'ja-JP': {
      return jaJpFlat as Record<string, string>;
    }
    case 'ko-KR': {
      return koKrFlat as Record<string, string>;
    }
    case 'id-ID': {
      return idIdFlat as Record<string, string>;
    }
    case 'vi-VN': {
      return viVnFlat as Record<string, string>;
    }
    case 'th-TH': {
      return thThFlat as Record<string, string>;
    }
    case 'ms-MY': {
      return msMyFlat as Record<string, string>;
    }
    case 'zh-CN':
    default: {
      return zhCnFlat as Record<string, string>;
    }
  }
}

/**
 * 加载应用特有的语言包
 * 每次语言切换都会走这里：业务 langs + menu-titles 一并 merge，
 * 避免 setLocaleMessage 冲掉登录时 inject 的菜单标题后回退到错误语种
 * @param lang
 */
async function loadMessages(
  lang: SupportedLanguagesType,
): Promise<Record<string, LocaleMessageValue> | undefined> {
  const [appLocaleMessages] = await Promise.all([localesMap[lang]?.(), loadThirdPartyMessage(lang)]);
  const base = (appLocaleMessages?.default ?? {}) as Record<string, LocaleMessageValue>;
  // 菜单标题真相源：menu-titles/{lang}.json，与 injectMenuI18n 同源
  // 顶层 flat key: 框架组件 fallback 文案(cancel/confirm/expand/collapse)
  return {
    ...base,
    ...getMenuTitlesFor(lang),
    ...getFlatMessagesFor(lang),
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
    case 'id-ID': {
      locale = await import('dayjs/locale/id');
      break;
    }
    case 'vi-VN': {
      locale = await import('dayjs/locale/vi');
      break;
    }
    case 'th-TH': {
      locale = await import('dayjs/locale/th');
      break;
    }
    case 'ms-MY': {
      locale = await import('dayjs/locale/ms');
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
    case 'id-ID': {
      antdLocale.value = antdIdLocale;
      break;
    }
    case 'vi-VN': {
      antdLocale.value = antdViLocale;
      break;
    }
    case 'th-TH': {
      antdLocale.value = antdThLocale;
      break;
    }
    case 'ms-MY': {
      antdLocale.value = antdMsLocale;
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
    case 'id-ID': {
      VxeUI.setLanguage('id-ID');
      break;
    }
    case 'vi-VN': {
      VxeUI.setLanguage('vi-VN');
      break;
    }
    case 'th-TH': {
      VxeUI.setLanguage('th-TH');
      break;
    }
    case 'ms-MY': {
      VxeUI.setLanguage('ms-MY');
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
