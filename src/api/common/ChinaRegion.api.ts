import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'

/**
 * 获取一级行政区
 */
export function findAllProvince() {
  return defHttp.get<Result<Region[]>>({
    url: '/china/region/findAllProvince',
  })
}

/**
 * 获取省市二级联动
 */
export function findAllProvinceAndCity() {
  return defHttp.get<Result<Region[]>>({
    url: '/china/region/findAllProvinceAndCity',
  })
}
/**
 * 获取省市区三级联动
 */
export function findAllProvinceAndCityAndArea() {
  return defHttp.get<Result<Region[]>>({
    url: '/china/region/findAllProvinceAndCityAndArea',
  })
}
/**
 * 根据区划代码获取下级行政区划的列表
 */
export function findAllRegionByParentCode(code: string) {
  return defHttp.get<Result<Region[]>>({
    url: '/china/region/findAllRegionByParentCode',
    params: { code },
  })
}

/**
 * 区域
 */
export interface Region {
  code: string
  name: string
  /** 省市区街道 */
  level: 1 | 2 | 3 | 4
  isLeaf?: boolean
  children: Region[]
}
