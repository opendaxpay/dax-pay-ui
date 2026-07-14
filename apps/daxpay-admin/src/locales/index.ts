// @ts-ignore
import type { Locale } from 'antdv-next/dist/locale';

import type { App } from 'vue';

import type { LocaleSetupOptions, SupportedLanguagesType } from '@vben/locales';

import { ref } from 'vue';

import { $t, setupI18n as coreSetup, loadLocalesMapFromDir } from '@vben/locales';
import { preferences } from '@vben/preferences';

import antdEnLocale from 'antdv-next/dist/locale/en_US';
import antdHkLocale from 'antdv-next/dist/locale/zh_HK';
import antdTwLocale from 'antdv-next/dist/locale/zh_TW';
import antdDefaultLocale from 'antdv-next/dist/locale/zh_CN';
import dayjs from 'dayjs';
import { VxeUI } from 'vxe-table';

const antdLocale = ref<Locale>(antdDefaultLocale);

const modules = import.meta.glob('./langs/**/*.json');

const localesMap = loadLocalesMapFromDir(/\.\/langs\/([^/]+)\/(.*)\.json$/, modules);

/**
 * 加载应用特有的语言包
 * 这里也可以改造为从服务端获取翻译数据
 * @param lang
 */
async function loadMessages(lang: SupportedLanguagesType) {
  const [appLocaleMessages] = await Promise.all([localesMap[lang]?.(), loadThirdPartyMessage(lang)]);
  return appLocaleMessages?.default;
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
