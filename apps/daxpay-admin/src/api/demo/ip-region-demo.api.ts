import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * IP 归属地查询演示 API
 */
export const IpRegionDemoApi = {
  /**
   * 根据 IP 查询归属地
   */
  query(ip: string): Promise<Result<IpRegionDemoResult>> {
    return defHttp.get({ url: '/demo/ip-region/query', params: { ip } });
  },

  /**
   * 查询当前请求者 IP 归属地（自动解析 X-Forwarded-For 等代理头）
   */
  current(): Promise<Result<IpRegionDemoResult>> {
    return defHttp.get({ url: '/demo/ip-region/current' });
  },
};

/**
 * IP 归属地查询结果
 */
export interface IpRegionDemoResult {
  /** 查询的 IP 地址 */
  ip: string;
  /** 国家 */
  country?: string;
  /** 省份 */
  province?: string;
  /** 城市 */
  city?: string;
  /** ISP 运营商 */
  isp?: string;
  /** 国家码(iso-alpha2, 如 CN/HK/US) */
  countryCode?: string;
  /** 格式化后的归属地文本（与审计日志 location 字段同源） */
  regionStr?: string;
  /** 是否内网地址 */
  innerIp?: boolean;
  /** 是否国内地址 */
  chinaIp?: boolean;
}
