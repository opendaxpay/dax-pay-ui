/**
 * 国际化模块入口文件
 * 
 * 提供统一的导出接口，包含：
 * 1. 翻译函数：$t, $te
 * 2. 核心功能：i18n 实例、初始化函数、语言包加载函数
 * 3. 类型定义：语言类型、配置选项等
 * 4. Vue I18n 原生功能：useI18n hook
 */

import {
  i18n,
  loadLocaleMessages,
  loadLocalesMapFromDir,
  setupI18n,
} from './i18n';

/**
 * 翻译函数
 * 用法：$t('common.save') → "保存"
 */
const $t = i18n.global.t;

/**
 * 翻译存在检查函数
 * 用法：$te('common.save') → true（如果 key 存在）
 */
const $te = i18n.global.te;

export {
  $t,
  $te,
  i18n,
  loadLocaleMessages,
  loadLocalesMapFromDir,
  setupI18n,
};
export {
  type ImportLocaleFn,
  type LocaleSetupOptions,
  type SupportedLanguagesType,
} from './typing';
export type { CompileError } from '@intlify/core-base';

/**
 * Vue I18n Composition API hook
 * 在组件中使用：const { t, locale } = useI18n()
 */
export { useI18n } from 'vue-i18n';

export type { Locale } from 'vue-i18n';
