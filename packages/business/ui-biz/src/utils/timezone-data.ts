/**
 * 时区区域标识
 * 与国际化 key `timezone.region.{region}` 对应
 */
export type TimezoneRegion = 'africa' | 'america' | 'asia' | 'europe' | 'oceania' | 'universal';

/**
 * 时区原始数据项
 * 仅描述归属区域与 IANA 时区名, 显示用的偏移/长名称在运行时动态计算
 */
export interface TimezoneRawOption {
  // 所属区域
  region: TimezoneRegion;
  // IANA 时区标识, 如 Asia/Shanghai
  timezone: string;
}

/**
 * 精选常用时区列表 (~57 个)
 * 覆盖全球主要城市, 按区域分组
 * 显示顺序由下方数组的书写顺序决定
 */
export const TIMEZONE_LIST: TimezoneRawOption[] = [
  // 亚洲
  { region: 'asia', timezone: 'Asia/Shanghai' },
  { region: 'asia', timezone: 'Asia/Hong_Kong' },
  { region: 'asia', timezone: 'Asia/Taipei' },
  { region: 'asia', timezone: 'Asia/Tokyo' },
  { region: 'asia', timezone: 'Asia/Seoul' },
  { region: 'asia', timezone: 'Asia/Singapore' },
  { region: 'asia', timezone: 'Asia/Kuala_Lumpur' },
  { region: 'asia', timezone: 'Asia/Bangkok' },
  { region: 'asia', timezone: 'Asia/Jakarta' },
  { region: 'asia', timezone: 'Asia/Manila' },
  { region: 'asia', timezone: 'Asia/Ho_Chi_Minh' },
  { region: 'asia', timezone: 'Asia/Kolkata' },
  { region: 'asia', timezone: 'Asia/Karachi' },
  { region: 'asia', timezone: 'Asia/Dhaka' },
  { region: 'asia', timezone: 'Asia/Dubai' },
  { region: 'asia', timezone: 'Asia/Riyadh' },
  { region: 'asia', timezone: 'Asia/Tehran' },
  { region: 'asia', timezone: 'Asia/Jerusalem' },
  { region: 'asia', timezone: 'Asia/Istanbul' },
  // 欧洲
  { region: 'europe', timezone: 'Europe/London' },
  { region: 'europe', timezone: 'Europe/Dublin' },
  { region: 'europe', timezone: 'Europe/Paris' },
  { region: 'europe', timezone: 'Europe/Berlin' },
  { region: 'europe', timezone: 'Europe/Madrid' },
  { region: 'europe', timezone: 'Europe/Rome' },
  { region: 'europe', timezone: 'Europe/Amsterdam' },
  { region: 'europe', timezone: 'Europe/Brussels' },
  { region: 'europe', timezone: 'Europe/Zurich' },
  { region: 'europe', timezone: 'Europe/Vienna' },
  { region: 'europe', timezone: 'Europe/Stockholm' },
  { region: 'europe', timezone: 'Europe/Warsaw' },
  { region: 'europe', timezone: 'Europe/Athens' },
  { region: 'europe', timezone: 'Europe/Moscow' },
  // 美洲
  { region: 'america', timezone: 'America/New_York' },
  { region: 'america', timezone: 'America/Toronto' },
  { region: 'america', timezone: 'America/Chicago' },
  { region: 'america', timezone: 'America/Mexico_City' },
  { region: 'america', timezone: 'America/Denver' },
  { region: 'america', timezone: 'America/Los_Angeles' },
  { region: 'america', timezone: 'America/Vancouver' },
  { region: 'america', timezone: 'America/Anchorage' },
  { region: 'america', timezone: 'America/Bogota' },
  { region: 'america', timezone: 'America/Lima' },
  { region: 'america', timezone: 'America/Santiago' },
  { region: 'america', timezone: 'America/Sao_Paulo' },
  { region: 'america', timezone: 'America/Buenos_Aires' },
  // 非洲
  { region: 'africa', timezone: 'Africa/Cairo' },
  { region: 'africa', timezone: 'Africa/Lagos' },
  { region: 'africa', timezone: 'Africa/Nairobi' },
  { region: 'africa', timezone: 'Africa/Johannesburg' },
  { region: 'africa', timezone: 'Africa/Casablanca' },
  // 大洋洲
  { region: 'oceania', timezone: 'Australia/Perth' },
  { region: 'oceania', timezone: 'Australia/Sydney' },
  { region: 'oceania', timezone: 'Australia/Melbourne' },
  { region: 'oceania', timezone: 'Pacific/Auckland' },
  { region: 'oceania', timezone: 'Pacific/Fiji' },
  // 通用
  { region: 'universal', timezone: 'UTC' },
];

/**
 * 区域展示顺序 (与书写顺序一致, 显式声明便于维护)
 */
export const TIMEZONE_REGION_ORDER: TimezoneRegion[] = ['asia', 'europe', 'america', 'oceania', 'africa', 'universal'];
