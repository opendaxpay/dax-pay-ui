import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'
import { BaseEntity } from '#/web'

/**
 * 分页
 */
export const page = (params) => {
  return defHttp.get<Result<PageResult<Merchant>>>({
    url: '/admin/merchant/page',
    params,
  })
}
/**
 * 详情
 */
export const get = (id) => {
  return defHttp.get<Result<Merchant>>({
    url: '/admin/merchant/findById',
    params: { id },
  })
}
/**
 * 创建商户
 */
export const add = (obj) => {
  return defHttp.post<Result<void>>({
    url: '/admin/merchant/add',
    data: obj,
  })
}
/**
 * 更新商户
 */
export const update = (obj) => {
  return defHttp.post<Result<void>>({
    url: '/admin/merchant/update',
    data: obj,
  })
}

/**
 * 删除
 */
export const del = (id) => {
  return defHttp.post<Result<void>>({
    url: '/admin/merchant/delete',
    params: { id },
  })
}

/**
 * 商户
 */
export interface Merchant extends BaseEntity {
  // 商户号
  mchNo?: string
  // 商户名称
  mchName?: string
  // 商户类型
  merchantType?: string
  // 是否有关联管理员
  administrator?: boolean
  // 状态
  status?: string
  // 创建默认应用
  createDefaultApp?: boolean
}

/**
 * 商户创建参数
 */
export interface MerchantCreate {
  // 商户名称
  mchName?: string
  // 代理商
  agentNo?: string
  // 创建默认应用
  createDefaultApp?: boolean
  // 状态
  status?: string
  // 管理员名称
  name?: string
  // 商户管理员账号
  account?: string
  // 商户管理员密码
  password?: string
  // 重复密码
  confirmPassword?: string
}
