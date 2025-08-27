import { PageResult } from '#/axios'

/**
 * 分页参数
 */
export interface PageParam {
  // 每页数量
  size: number
  // 当前页数
  current: number
}

/**
 * 分页表格列表对象
 */
export interface TablePageModel<T = any> {
  // 分页参数
  pages: PageParam
  // 查询参数
  queryParam: any
  // 结果
  pagination: PageResult<T>
}

/**
 * 基础实体对象
 */
export interface BaseEntity {
  id?: number | string | null
  createTime?: string | null
}

/**
 * 商户应用基础实体对象
 */
export interface MchEntity extends BaseEntity {
  // 商户号
  mchNo?: string
  // 商户名称
  mchName?: string
  // 应用号
  appId?: string
  // 应用名称
  appName?: string
}

/**
 * 键值对对象
 */
export interface KeyValue {
  key: string
  value: string
}
