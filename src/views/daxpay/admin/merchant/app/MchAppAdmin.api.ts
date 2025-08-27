import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'
import { BaseEntity } from '#/web'

/**
 * 分页
 */
export const page = (params) => {
  return defHttp.get<Result<PageResult<MchApp>>>({
    url: '/admin/mch/app/page',
    params,
  })
}
/**
 * 详情
 */
export const get = (id) => {
  return defHttp.get<Result<MchApp>>({
    url: '/admin/mch/app/findById',
    params: { id },
  })
}
/**
 * 新增
 */
export const add = (obj) => {
  return defHttp.post<Result<void>>({
    url: '/admin/mch/app/add',
    data: obj,
  })
}
/**
 * 更新
 */
export const update = (obj) => {
  return defHttp.post<Result<void>>({
    url: '/admin/mch/app/update',
    data: obj,
  })
}

/**
 * 删除
 */
export const del = (id) => {
  return defHttp.post<Result<void>>({
    url: '/admin/mch/app/delete',
    params: { id },
  })
}

/**
 * 商户应用
 */
export interface MchApp extends BaseEntity {
  // 商户号
  mchNo?: string
  // 商户名称
  mchName?: string
  // 应用号
  appId?: string
  // 应用名称
  appName?: string
  // 签名方式
  signType?: string
  // 签名秘钥
  signSecret?: string
  // 是否对请求进行验签
  reqSign?: boolean
  // 支付限额
  limitAmount?: number
  // 订单默认超时时间(分钟)
  orderTimeout?: number
  // 是否验证请求时间是否超时
  reqTimeout?: boolean
  // 请求超时时间(秒)
  reqTimeoutSecond?: number
  // 异步消息通知类型
  notifyType?: string
  // 通知地址, http/WebSocket 需要配置
  notifyUrl?: string
  // 状态
  status?: string
}
