import type { App } from 'vue';
import type { Locale } from 'vue-i18n';

import type {
  ImportLocaleFn,
  LoadMessageFn,
  LocaleMessageValue,
  LocaleSetupOptions,
  SupportedLanguagesType,
} from './typing';

import { unref } from 'vue';
import { createI18n } from 'vue-i18n';

import { useSimpleLocale } from '@vben-core/composables';

/**
 * 创建 i18n 实例
 * - globalInjection: true - 允许在模板中直接使用 $t
 * - legacy: false - 使用 Composition API 模式
 */
const i18n = createI18n({
  globalInjection: true,
  legacy: false,
  locale: '',
  // 缺 key 时回退简体中文，避免界面直接露出 raw key
  fallbackLocale: 'zh-CN',
  messages: {},
});

/**
 * 使用 Vite 的 glob 导入功能加载所有语言包文件
 * 匹配 ./langs 目录下的所有 .json 文件（包括嵌套目录）
 * 例如：./langs/zh-CN/common.json, ./langs/zh-CN/iam/perm/role.json
 */
const modules = import.meta.glob('./langs/**/*.json');

const { setSimpleLocale } = useSimpleLocale();

/**
 * 解析语言包文件路径，生成语言到加载函数的映射
 *
 * 正则说明：/\.\/langs\/([^/]+)\/(.*)\.json$/
 * - ([^/]+) 匹配语言代码（如 zh-CN、en-US）
 * - (.*) 匹配文件路径（支持嵌套目录，如 iam/perm/role）
 *
 * 示例转换：
 * - ./langs/zh-CN/common.json → locale: zh-CN, keyPath: ['common']
 * - ./langs/zh-CN/iam/perm/role.json → locale: zh-CN, keyPath: ['iam', 'perm', 'role']
 */
const localesMap = loadLocalesMapFromDir(/\.\/langs\/([^/]+)\/(.*)\.json$/, modules);
let loadMessages: LoadMessageFn;

/**
 * 判断值是否为普通对象
 * 用于区分对象和其他类型（如字符串、数组）
 */
function isPlainObject(value: unknown): value is Record<string, LocaleMessageValue> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * 深度克隆语言包值
 * 确保合并时不会修改原始对象
 *
 * @param value - 要克隆的值（字符串、对象或数组）
 * @returns 克隆后的新值
 */
function cloneLocaleValue<T extends LocaleMessageValue>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneLocaleValue(item)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneLocaleValue(item)])) as T;
  }

  return value;
}

/**
 * 创建语言包 key 冲突错误
 * 当尝试将不同类型的值合并到同一个 key 时抛出
 *
 * @param locale - 语言代码
 * @param keyPath - 冲突的 key 路径
 * @param filePath - 引发冲突的文件路径
 */
function createLocaleConflictError(locale: string, keyPath: string[], filePath: string) {
  const targetPath = keyPath.join('.');

  return new Error(`[i18n] Locale key conflict detected for "${locale}.${targetPath}" from "${filePath}".`);
}

/**
 * 递归合并两个语言包对象
 *
 * 合并规则：
 * 1. 如果目标对象中不存在该 key，直接赋值
 * 2. 如果两者都是对象，递归合并
 * 3. 如果类型冲突（如一个是字符串，一个是对象），抛出错误
 *
 * @param target - 目标对象（会被修改）
 * @param source - 源对象
 * @param locale - 语言代码（用于错误信息）
 * @param keyPath - 当前 key 路径（用于错误信息）
 * @param filePath - 文件路径（用于错误信息）
 */
function mergeLocaleObject(
  target: Record<string, LocaleMessageValue>,
  source: Record<string, LocaleMessageValue>,
  locale: string,
  keyPath: string[],
  filePath: string,
) {
  for (const [key, value] of Object.entries(source)) {
    const nextKeyPath = [...keyPath, key];
    const currentValue = target[key];

    if (currentValue === undefined) {
      target[key] = cloneLocaleValue(value);
      continue;
    }

    if (isPlainObject(currentValue) && isPlainObject(value)) {
      mergeLocaleObject(currentValue, value, locale, nextKeyPath, filePath);
      continue;
    }

    throw createLocaleConflictError(locale, nextKeyPath, filePath);
  }
}

/**
 * 将语言包内容赋值到消息对象的指定路径
 *
 * 核心功能：
 * 1. 根据 keyPath 创建嵌套结构
 * 2. 处理路径上已存在值的情况
 * 3. 检测并报告 key 冲突
 *
 * 示例：
 * - keyPath: ['iam', 'perm', 'role']
 * - value: { "name": "角色名称" }
 * 结果：messages.iam.perm.role = { "name": "角色名称" }
 *
 * @param messages - 消息对象（会被修改）
 * @param locale - 语言代码
 * @param filePath - 文件路径
 * @param keyPath - key 路径数组
 * @param value - 要赋值的内容
 */
function assignLocaleMessage(
  messages: Record<string, LocaleMessageValue>,
  locale: string,
  filePath: string,
  keyPath: string[],
  value: LocaleMessageValue,
) {
  let current = messages;

  for (const [index, segment] of keyPath.entries()) {
    const currentKeyPath = keyPath.slice(0, index + 1);
    const isLast = index === keyPath.length - 1;
    const currentValue = current[segment];

    // 到达最后一层，执行赋值或合并
    if (isLast) {
      if (currentValue === undefined) {
        current[segment] = cloneLocaleValue(value);
        return;
      }

      if (isPlainObject(currentValue) && isPlainObject(value)) {
        mergeLocaleObject(currentValue, value, locale, currentKeyPath, filePath);
        return;
      }

      throw createLocaleConflictError(locale, currentKeyPath, filePath);
    }

    // 中间路径：创建或进入下一层
    if (currentValue === undefined) {
      current[segment] = {};
      current = current[segment] as Record<string, LocaleMessageValue>;
      continue;
    }

    if (!isPlainObject(currentValue)) {
      throw createLocaleConflictError(locale, currentKeyPath, filePath);
    }

    current = currentValue;
  }
}

/**
 * 加载支持嵌套目录结构的语言包模块
 *
 * 工作流程：
 * 1. 遍历所有匹配的文件路径
 * 2. 解析出语言代码和 key 路径
 * 3. 为每种语言创建懒加载函数
 * 4. 加载时将所有文件内容合并到统一的消息对象中
 *
 * 嵌套目录支持示例：
 * - ./langs/zh-CN/iam.json → key: iam.xxx
 * - ./langs/zh-CN/iam/perm.json → key: iam.perm.xxx
 * - ./langs/zh-CN/iam/perm/role.json → key: iam.perm.role.xxx
 *
 * @param regexp - 用于解析文件路径的正则表达式
 * @param modules - Vite glob 导入的模块对象
 * @returns 语言到加载函数的映射
 */
function loadLocalesMapFromDir(
  regexp: RegExp,
  modules: Record<string, () => Promise<unknown>>,
): Record<Locale, ImportLocaleFn> {
  // 临时存储：按语言分组，记录每个文件的路径、加载函数和 key 路径
  const localesRaw: Record<
    Locale,
    Array<{
      filePath: string;
      importFn: () => Promise<unknown>;
      keyPath: string[];
    }>
  > = {};
  const localesMap: Record<Locale, ImportLocaleFn> = {};

  // 第一阶段：解析所有文件路径，按语言分组
  for (const path in modules) {
    const match = path.match(regexp);
    if (!match) {
      continue;
    }

    const [, locale, fileName] = match;
    if (!locale || !fileName || !modules[path]) {
      continue;
    }

    localesRaw[locale] ||= [];
    localesRaw[locale].push({
      filePath: path,
      importFn: modules[path],
      // 将文件路径转换为 key 路径数组
      // 例如：'iam/perm/role' → ['iam', 'perm', 'role']
      keyPath: fileName.split('/').filter(Boolean),
    });
  }

  // 第二阶段：为每种语言创建加载函数
  for (const [locale, files] of Object.entries(localesRaw)) {
    localesMap[locale] = async () => {
      const messages: Record<string, LocaleMessageValue> = {};

      // 依次加载并合并所有语言包文件
      for (const { filePath, importFn, keyPath } of files) {
        const module = (await importFn()) as { default?: LocaleMessageValue };

        if (module.default === undefined) {
          continue;
        }

        // 将文件内容赋值到对应的 key 路径
        assignLocaleMessage(messages, locale, filePath, keyPath, module.default);
      }

      return { default: messages };
    };
  }

  return localesMap;
}

/**
 * 设置 i18n 当前语言
 * 同时更新 HTML 标签的 lang 属性
 *
 * @param locale - 目标语言代码
 */
function setI18nLanguage(locale: Locale) {
  i18n.global.locale.value = locale;

  document?.querySelector('html')?.setAttribute('lang', locale);
}

/**
 * 初始化 i18n 插件
 *
 * 初始化流程：
 * 1. 注册 i18n 插件到 Vue 应用
 * 2. 加载默认语言的语言包
 * 3. 设置缺失 key 的警告处理器
 *
 * @param app - Vue 应用实例
 * @param options - 初始化配置选项
 */
async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  const { defaultLocale = 'zh-CN' } = options;
  // app可以自行扩展一些第三方库和组件库的国际化
  loadMessages = options.loadMessages || (async () => ({}));
  app.use(i18n);
  await loadLocaleMessages(defaultLocale);

  // 在控制台打印警告
  i18n.global.setMissingHandler((locale, key) => {
    if (options.missingWarn && key.includes('.')) {
      console.warn(`[intlify] Not found '${key}' key in '${locale}' locale messages.`);
    }
  });
}

/**
 * 加载指定语言的语言包
 *
 * 加载流程：
 * 1. 检查是否已经是当前语言（避免重复加载）
 * 2. 更新简单语言状态（用于非响应式场景）
 * 3. 加载核心语言包
 * 4. 合并应用层语言包
 * 5. 更新当前语言设置
 *
 * @param lang - 目标语言
 */
async function loadLocaleMessages(lang: SupportedLanguagesType) {
  if (unref(i18n.global.locale) === lang) {
    return setI18nLanguage(lang);
  }
  setSimpleLocale(lang);

  const message = await localesMap[lang]?.();

  if (message?.default) {
    i18n.global.setLocaleMessage(lang, message.default);
  }

  const mergeMessage = await loadMessages(lang);
  i18n.global.mergeLocaleMessage(lang, mergeMessage);

  return setI18nLanguage(lang);
}

export { i18n, loadLocaleMessages, loadLocalesMapFromDir, setupI18n };
