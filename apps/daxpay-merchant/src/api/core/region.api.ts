import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 中国行政区划 API
 */
export const ChinaRegionApi = {
  /**
   * 获取所有省份
   */
  findAllProvince(): Promise<Result<Region[]>> {
    return defHttp.get({ url: '/china/region/all-province' });
  },

  /**
   * 获取省市二级联动数据
   */
  findAllProvinceAndCity(): Promise<Result<Region[]>> {
    return defHttp.get({ url: '/china/region/all-province-and-city' });
  },

  /**
   * 获取省市区三级联动数据
   */
  findAllProvinceAndCityAndArea(): Promise<Result<Region[]>> {
    return defHttp.get({ url: '/china/region/all-province-and-city-and-area' });
  },

  /**
   * 根据区划代码获取下级行政区划的列表
   * @param code 区划代码
   */
  findAllRegionByParentCode(code: string): Promise<Result<Region[]>> {
    return defHttp.get({
      url: '/china/region/all-region-by-parent-code',
      params: { code },
    });
  },
};

/**
 * 行政区划
 */
export interface Region {
  /** 区划编码 */
  code: string;
  /** 名称 */
  name: string;
  /** 级别: 1-省, 2-市, 3-区县, 4-街道 */
  level: 1 | 2 | 3 | 4;
  /** 上级编码 */
  parentCode?: string;
  /** 下级行政区域 */
  children?: Region[];
}
