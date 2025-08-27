import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'
import { unref } from 'vue'

/**
 * 获取单条
 */
export function getConfig(id) {
  return defHttp.get<Result<VbillIsvConfig>>({
    url: '/isv/vbill/config/findById',
    params: { id: unref(id) },
  })
}

/**
 * 保存或更新
 */
export function saveOrUpdate(obj: VbillIsvConfig) {
  return defHttp.post({
    url: '/isv/vbill/config/saveOrUpdate',
    data: obj,
  })
}

/**
 * 随行付服务商配置
 */
export interface VbillIsvConfig extends MchEntity {
  // 天阙机构id
  orgId?: string
  // 是否启用
  enable: boolean
  // 沙箱
  sandbox: boolean
  // 支付限额
  limitAmount?: number
  // 天阙公钥
  publicKey?: string
  // 私钥
  privateKey?: string
  // 微信AppId
  wxAppId?: string
  // 微信AppSecret
  wxAppSecret?: string
  // 微信授权认证地址
  wxAuthUrl?: string
}
