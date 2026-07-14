/**
 * @zh_CN 登录页面 url 地址
 */
export const LOGIN_PATH = '/auth/login';

export interface LanguageOption {
  label: string;
  value: 'en-US' | 'zh-CN' | 'zh-TW' | 'zh-HK';
}

/**
 * Supported languages
 * 简体 / 英文 / 繁体（台湾）/ 繁体（香港）
 */
export const SUPPORT_LANGUAGES: LanguageOption[] = [
  {
    label: '简体中文',
    value: 'zh-CN',
  },
  {
    label: 'English',
    value: 'en-US',
  },
  {
    label: '繁體中文（台灣）',
    value: 'zh-TW',
  },
  {
    label: '繁體中文（香港）',
    value: 'zh-HK',
  },
];
