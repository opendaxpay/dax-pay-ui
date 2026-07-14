/**
 * 支持的语言类型
 * 简体 / 英文 / 繁体台湾 / 繁体香港
 */
export type SupportedLanguagesType = 'en-US' | 'zh-CN' | 'zh-TW' | 'zh-HK';

/**
 * 国际化消息值的类型定义
 * 支持三种类型：
 * - 字符串：最基础的翻译文本
 * - 对象：嵌套的翻译结构，如 { "user": { "name": "用户名" } }
 * - 数组：翻译列表
 */
export type LocaleMessageValue =
  | LocaleMessageValue[]
  | string
  | { [key: string]: LocaleMessageValue };

/**
 * 导入语言包的函数类型
 * 用于动态加载语言包文件，返回包含 default 导出的 Promise
 * 示例：() => import('./langs/zh-CN/common.json')
 */
export type ImportLocaleFn = () => Promise<{
  default: Record<string, LocaleMessageValue>;
}>;

/**
 * 加载消息的函数类型
 * 用于应用层加载额外的语言包（如从服务端获取）
 * @param lang - 目标语言
 * @returns 返回语言包对象或 undefined
 */
export type LoadMessageFn = (
  lang: SupportedLanguagesType,
) => Promise<Record<string, LocaleMessageValue> | undefined>;

/**
 * 国际化初始化配置选项
 */
export interface LocaleSetupOptions {
  /**
   * 默认语言
   * @default zh-CN
   */
  defaultLocale?: SupportedLanguagesType;
  /**
   * 加载消息函数
   * 用于加载应用特有的语言包，可从服务端获取或本地加载
   * @param lang - 目标语言
   * @returns 返回语言包对象
   */
  loadMessages?: LoadMessageFn;
  /**
   * 是否在找不到翻译 key 时输出警告
   * 开发环境建议开启，生产环境建议关闭
   */
  missingWarn?: boolean;
}
