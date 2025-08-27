import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'
import { BaseEntity } from '#/web'

/**
 * 分页
 */
export const page = (params) => {
  return defHttp.get<Result<PageResult<DictItem>>>({
    url: '/dict/item/pageByDictionaryId',
    params,
  })
}

/**
 * 获取单条
 */
export const get = (id) => {
  return defHttp.get<Result<DictItem>>({
    url: '/dict/item/findById',
    params: { id },
  })
}

/**
 * 添加
 */
export const add = (obj: DictItem) => {
  return defHttp.post({
    url: '/dict/item/add',
    data: obj,
  })
}

/**
 * 更新
 */
export const update = (obj: DictItem) => {
  return defHttp.post({
    url: '/dict/item/update',
    data: obj,
  })
}

/**
 * 删除
 */
export const del = (id) => {
  return defHttp.post({
    url: '/dict/item/delete',
    params: { id },
  })
}

/**
 * 查询全部
 */
export const findAll = () => {
  return defHttp.get<Result<Array<DictItem>>>({
    url: '/dict/item/findAll',
  })
}
/**
 * 查询全部已经启用
 */
export const findAllByEnable = () => {
  return defHttp.get<Result<Array<DictItem>>>({
    url: '/dict/item/findAllByEnable',
  })
}

/**
 * 编码是否存在
 */
export function existsByCode(code, dictId) {
  return defHttp.get<Result<boolean>>({
    url: '/dict/item/existsByCode',
    params: { code, dictId },
  })
}
export function existsByCodeNotId(code, id, dictId) {
  return defHttp.get<Result<boolean>>({
    url: '/dict/item/existsByCodeNotId',
    params: { code, id, dictId },
  })
}

/**
 * 字典项
 */
export interface DictItem extends BaseEntity {
  // 字典id
  dictId?: number | null
  // 字典code
  dictCode?: string | null
  // 字典项code
  code?: string
  // 字典项名称
  name?: string
  // 是否启用
  enable?: boolean
  // 排序
  sortNo?: number
  // 备注
  remark?: string
}
