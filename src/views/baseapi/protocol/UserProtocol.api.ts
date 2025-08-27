import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'
import { BaseEntity } from '#/web'

/**
 * 分页
 */
export const page = (params) => {
  return defHttp.get<Result<PageResult<UserProtocol>>>({
    url: '/user/protocol/page',
    params,
  })
}

/**
 * 获取单条
 */
export const get = (id) => {
  return defHttp.get<Result<UserProtocol>>({
    url: '/user/protocol/findById',
    params: { id },
  })
}

/**
 * 添加
 */
export const add = (obj: UserProtocol) => {
  return defHttp.post({
    url: '/user/protocol/add',
    data: obj,
  })
}

/**
 * 更新
 */
export const update = (obj: UserProtocol) => {
  return defHttp.post({
    url: '/user/protocol/update',
    data: obj,
  })
}

/**
 * 删除
 */
export const del = (id) => {
  return defHttp.post({
    url: '/user/protocol/delete',
    params: { id },
  })
}

/**
 * 用户协议
 */
export interface UserProtocol extends BaseEntity {
  /** 名称 */
  name?: string
  /** 显示名称 */
  showName?: string
  /** 类型 */
  type?: string
  /** 默认协议 */
  defaultProtocol?: boolean
  /** 内容 */
  content?: string
}
