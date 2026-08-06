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

  /**
   * 地理围栏策略预览: 查询指定城市的交界邻市与同省全部城市
   * @param cityCode 城市编码(4位)
   */
  previewGeoFence(cityCode: string): Promise<Result<GeoFencePreview>> {
    return defHttp.get({
      url: '/china/region/geo-fence-preview',
      params: { cityCode },
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

/**
 * 地理围栏策略预览结果
 */
export interface GeoFencePreview {
  /** 选中的城市 */
  city: GeoFenceCityInfo;
  /** 交界城市列表(balanced 策略邻市) */
  adjacentCities: GeoFenceCityInfo[];
  /** 同省全部城市(loose 策略范围, 含自身) */
  provinceCities: GeoFenceCityInfo[];
}

/** 城市信息 */
export interface GeoFenceCityInfo {
  /** 城市编码(4位) */
  code: string;
  /** 城市名称 */
  name: string;
  /** 所属省份编码(2位) */
  provinceCode: string;
  /** 所属省份名称 */
  provinceName: string;
}
