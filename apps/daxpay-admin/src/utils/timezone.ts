import type { SupportedLanguagesType } from '@vben/locales';

import { TIMEZONE_LIST, TIMEZONE_REGION_ORDER, type TimezoneRegion } from './timezone-data';

/**
 * 单个时区选项 (供 antd Select 渲染)
 */
export interface TimezoneOptionItem {
  // IANA 时区标识, 作为 Select 的 value
  value: string;
  // 显示标签, 形如 "Shanghai (GMT+8)"
  label: string;
  // 当前真实偏移字符串, 形如 "GMT+8" / "GMT-5" / "GMT+5:30", 夏令时自动正确
  offset: string;
  // 本地化长时区名, 形如 "中国标准时间" / "Chinese Standard Time"
  longName: string;
  // 城市英文名 (IANA 末段), 形如 "Shanghai"
  city: string;
}

/**
 * 分组后的时区选项 (对应 antd Select 的 OptGroup 结构)
 * 注意: label 留空, 由组件层通过 i18n 填充区域名称
 */
export interface TimezoneGroupOption {
  // 区域标识, 用于组件层翻译区域标题
  region: TimezoneRegion;
  // 该区域下的时区选项
  options: TimezoneOptionItem[];
}

/**
 * 计算指定时区相对 UTC 的当前真实偏移
 * 使用 Intl 的 shortOffset, 自动处理夏令时, 形如 "GMT+8" / "GMT-5" / "GMT+5:30"
 * 解析失败时返回空字符串, 调用方按需 fallback
 * @param timezone IANA 时区标识
 */
export function getTimezoneOffset(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const part = formatter.formatToParts(new Date()).find((p) => p.type === 'timeZoneName');
    // 兼容老版本运行时输出 "GMT" 的情况, 统一成 "GMT+0"
    const value = part?.value ?? '';
    return value === 'GMT' ? 'GMT+0' : value;
  } catch {
    return '';
  }
}

/**
 * 获取指定时区在目标语言下的长显示名
 * 形如中文 "中国标准时间" / 英文 "Chinese Standard Time"
 * 解析失败时回退为 IANA 时区名
 * @param timezone IANA 时区标识
 * @param locale 语言, 如 zh-CN / en-US
 */
export function getTimezoneLongName(timezone: string, locale: SupportedLanguagesType): string {
  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      timeZoneName: 'long',
    });
    const part = formatter.formatToParts(new Date()).find((p) => p.type === 'timeZoneName');
    return part?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * 从 IANA 时区标识提取城市英文名
 * 如 "Asia/Shanghai" -> "Shanghai", "America/New_York" -> "New York"
 */
export function getCityName(timezone: string): string {
  return timezone.split('/').pop()?.replaceAll('_', ' ') ?? timezone;
}

/**
 * 构建按区域分组的时区选项
 * label 使用跟随当前语言的本地化长时区名 (Intl long), 形如
 *   zh-CN: "中国标准时间 (GMT+8)"
 *   en-US: "Chinese Standard Time (GMT+8)"
 * 偏移在运行时动态计算, 保证夏令时显示正确
 * @param locale 当前语言
 */
export function buildTimezoneOptions(locale: SupportedLanguagesType): TimezoneGroupOption[] {
  return TIMEZONE_REGION_ORDER.map((region) => {
    const options: TimezoneOptionItem[] = TIMEZONE_LIST.filter((item) => item.region === region).map((item) => {
      const { timezone } = item;
      // 偏移与本地化长名都依赖运行时, 此处一次性计算并复用
      const offset = getTimezoneOffset(timezone);
      const longName = getTimezoneLongName(timezone, locale);
      return {
        value: timezone,
        label: offset ? `${longName} (${offset})` : longName,
        offset,
        longName,
        city: getCityName(timezone),
      };
    });
    return { region, options };
  });
}
