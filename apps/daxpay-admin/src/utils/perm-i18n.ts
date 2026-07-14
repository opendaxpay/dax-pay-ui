import { $t, i18n } from '#/locales';
import enUsPerm from '../locales/langs/en-US/perm.json';
import zhCnPerm from '../locales/langs/zh-CN/perm.json';
import zhHkPerm from '../locales/langs/zh-HK/perm.json';
import zhTwPerm from '../locales/langs/zh-TW/perm.json';

/**
 * 将 perm.json（叶子 key 为权限码 code）展开为根级 flat key：
 * "iam:menu:view" → "perm.iam:menu:view"
 *
 * 与 menu-titles 注入策略一致：vue-i18n 对含冒号的路径式 key 不稳定时，
 * 可走 message[完整key] 精确匹配。
 */
function toFlatPermMessages(bag: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(bag).map(([code, label]) => [`perm.${code}`, label]));
}

/**
 * 注入权限码国际化文案（flat key）
 * 写入 zh-CN/en-US/zh-TW/zh-HK 与短码 zh/en
 * 可重复调用：语言切换会 setLocaleMessage 覆盖整包，需在翻译前再次 merge
 */
export function injectPermI18n() {
  const zh = toFlatPermMessages(zhCnPerm as Record<string, string>);
  const en = toFlatPermMessages(enUsPerm as Record<string, string>);
  const tw = toFlatPermMessages(zhTwPerm as Record<string, string>);
  const hk = toFlatPermMessages(zhHkPerm as Record<string, string>);
  i18n.global.mergeLocaleMessage('zh-CN', zh);
  i18n.global.mergeLocaleMessage('zh', zh);
  i18n.global.mergeLocaleMessage('en-US', en);
  i18n.global.mergeLocaleMessage('en', en);
  i18n.global.mergeLocaleMessage('zh-TW', tw);
  i18n.global.mergeLocaleMessage('zh-HK', hk);
}

/**
 * 安全翻译：仅当词条存在时才 $t，避免触发 missing 警告
 */
function translateIfExists(key?: string): string {
  if (!key || !i18n.global.te(key)) {
    return '';
  }
  const text = $t(key);
  return text && text !== key ? text : '';
}

/**
 * 权限码名称：优先语言包，失败回退 code
 */
export function translatePermCodeName(i18nKey?: string, code?: string): string {
  // 1) 嵌套 messages.perm[code]（loadLocalesMapFromDir 加载 perm.json）
  if (code) {
    const bag = i18n.global.tm('perm') as Record<string, unknown>;
    const fromBag = bag?.[code];
    if (typeof fromBag === 'string' && fromBag) {
      return fromBag;
    }
  }

  // 2) flat 注入后走整 key 精确匹配（与 menu-titles 策略一致）
  injectPermI18n();

  const fromKey = translateIfExists(i18nKey);
  if (fromKey) {
    return fromKey;
  }

  if (code) {
    const fromCode = translateIfExists(`perm.${code}`);
    if (fromCode) {
      return fromCode;
    }
  }

  return code || i18nKey || '';
}

/**
 * 分配树 / 列表展示：名称 (code)；名称与 code 相同时只显示一次
 */
export function formatPermCodeTitle(i18nKey?: string, code?: string): string {
  const name = translatePermCodeName(i18nKey, code);
  if (!code) {
    return name;
  }
  if (name === code) {
    return code;
  }
  return `${name} (${code})`;
}
