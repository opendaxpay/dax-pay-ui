import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'
import { unref } from 'vue'

/**
 * 获取单条
 */
export function getConfig(id) {
  return defHttp.get<Result<LeshuaPayConfig>>({
    url: '/leshua/config/findById',
    params: { id: unref(id) },
  })
}

/**
 * 保存或更新
 */
export function saveOrUpdate(obj: LeshuaPayConfig) {
  return defHttp.post({
    url: '/leshua/config/saveOrUpdate',
    data: obj,
  })
}

/**
 * 获取单条特约商户
 */
export function getSubConfig(id) {
  return defHttp.get<Result<LeshuaSubConfig>>({
    url: '/leshua/config/findSubById',
    params: { id: unref(id) },
  })
}

/**
 * 保存或更新特约商户
 */
export function saveOrUpdateSub(obj: LeshuaSubConfig) {
  return defHttp.post({
    url: '/leshua/config/saveOrUpdateSub',
    data: obj,
  })
}

/**
 * 乐刷支付配置
 */
export interface LeshuaPayConfig extends MchEntity {
  // 乐刷商户号
  lsMchNo?: string
  // 乐刷服务商号
  lsIsvNo?: string
  // 是否启用
  enable: boolean
  // 支付限额
  limitAmount?: number
  // 交易KEY
  tradeKey?: string
  // 异步通知key
  notifyKey?: string
  // 认证方式
  authType?: string
  // 签名类型
  signType?: string
  // 是否沙箱环境
  sandbox?: boolean
  // 微信AppId
  wxAppId?: string
  // 微信AppSecret
  wxAppSecret?: string
  // 微信授权认证地址
  wxAuthUrl?: string
}

/**
 * 子商户服务商配置
 */
export interface LeshuaSubConfig extends MchEntity {
  // 服务商号
  isvNo?: string
  // 乐刷商户号
  lsMchNo?: string
  // 是否启用
  enable: boolean
  // 读取服务商配置
  readSystem?: boolean
  // 微信AppId
  wxAppId?: string
  // 微信AppSecret
  wxAppSecret?: string
  // 微信授权认证地址
  wxAuthUrl?: string
}
