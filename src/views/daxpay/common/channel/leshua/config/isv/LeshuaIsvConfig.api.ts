import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'
import { unref } from 'vue'

/**
 * 获取单条
 */
export function getConfig(id) {
  return defHttp.get<Result<LeshuaIsvConfig>>({
    url: '/isv/leshua/config/findById',
    params: { id: unref(id) },
  })
}

/**
 * 保存或更新
 */
export function saveOrUpdate(obj: LeshuaIsvConfig) {
  return defHttp.post({
    url: '/isv/leshua/config/saveOrUpdate',
    data: obj,
  })
}

/**
 * 乐刷服务商配置
 */
export interface LeshuaIsvConfig extends MchEntity {
  // 乐刷服务商
  lsIsvNo?: string
  // 是否启用
  enable: boolean
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
