import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

type FormatDate = Date | dayjs.Dayjs | number | string;

type Format =
  | 'HH'
  | 'HH:mm'
  | 'HH:mm:ss'
  | 'YYYY'
  | 'YYYY-MM'
  | 'YYYY-MM-DD'
  | 'YYYY-MM-DD HH'
  | 'YYYY-MM-DD HH:mm'
  | 'YYYY-MM-DD HH:mm:ss'
  | (string & {});

/**
 * 格式化日期时间, 支持多种输入类型, 自动按用户时区转换显示
 * 后端返回的 UTC 时间 (如 "2026-06-13T08:30:00Z") 会被解析为 UTC 时间,
 * 然后通过 dayjs.tz() 转换为用户选中的时区后格式化输出
 * @param time 日期时间, 支持 Date、dayjs 对象、时间戳 (number)、字符串
 * @param format 输出格式, 默认 "YYYY-MM-DD"
 * @returns 格式化后的日期字符串
 */
export function formatDate(time?: FormatDate, format: Format = 'YYYY-MM-DD') {
  // 空值 (null、undefined、空字符串) 直接返回空字符串, 不做格式化也不报错
  if (time === null || time === undefined || time === '') {
    return '';
  }
  try {
    let date: dayjs.Dayjs;
    // 已经是 dayjs 对象, 直接复用
    if (dayjs.isDayjs(time)) {
      date = time;
    // ISO 8601 格式字符串 (末尾带 Z、含偏移 + 或 T 标记), 以 UTC 方式解析
    } else if (typeof time === 'string' && (time.endsWith('Z') || time.includes('+') || time.includes('T'))) {
      date = dayjs.utc(time);
    // 其他格式 (Date、时间戳、普通日期字符串等), 由 dayjs 默认解析
    } else {
      date = dayjs(time);
    }
    // 日期无效时静默返回空字符串, 不在控制台报错
    if (!date.isValid()) {
      return '';
    }
    // 按用户时区转换后格式化
    return date.tz().format(format);
  } catch {
    // 解析异常时返回原始值的字符串形式, 不在控制台报错
    return String(time ?? '');
  }
}

export function formatDateTime(time?: FormatDate) {
  return formatDate(time, 'YYYY-MM-DD HH:mm:ss');
}

export function isDate(value: any): value is Date {
  return value instanceof Date;
}

export function isDayjsObject(value: any): value is dayjs.Dayjs {
  return dayjs.isDayjs(value);
}

/**
 * 获取当前时区
 * @returns 当前时区
 */
export const getSystemTimezone = () => {
  return dayjs.tz.guess();
};

/**
 * 自定义设置的时区
 */
let currentTimezone = getSystemTimezone();

/**
 * 设置默认时区
 * @param timezone
 */
export const setCurrentTimezone = (timezone?: string) => {
  currentTimezone = timezone || getSystemTimezone();
  dayjs.tz.setDefault(currentTimezone);
};

/**
 * 获取设置的时区
 * @returns 设置的时区
 */
export const getCurrentTimezone = () => {
  return currentTimezone;
};
