import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'
import { unref } from 'vue'

/**
 * 获取单条
 */
export function getConfig(id) {
  return defHttp.get<Result<HkrtPayConfig>>({
    url: '/hkrt/config/findById',
    params: { id: unref(id) },
  })
}

/**
 * 保存或更新
 */
export function saveOrUpdate(obj: HkrtPayConfig) {
  return defHttp.post({
    url: '/hkrt/config/saveOrUpdate',
    data: obj,
  })
}
/**
 * 获取单条特约商户
 */
export function getSubConfig(id) {
  return defHttp.get<Result<HkrtSubConfig>>({
    url: '/hkrt/config/findSubById',
    params: { id: unref(id) },
  })
}

/**
 * 保存或更新特约商户
 */
export function saveOrUpdateSub(obj: HkrtSubConfig) {
  return defHttp.post({
    url: '/hkrt/config/saveOrUpdateSub',
    data: obj,
  })
}

/**
 * 海科支付配置
 */
export interface HkrtPayConfig extends MchEntity {
  // 商户编号
  merchNo?: string
  // 服务商编号
  agentNo?: string
  // 接入机构标识
  accessId?: string
  // SAAS终端号
  pn?: string
  // 是否启用
  enable: boolean
  // 密钥
  accessKey?: string
  // 传输密钥
  transferKey?: string
  // 是否沙箱环境
  sandbox?: boolean
  // 交易API地址
  tradeUrl?: string
  // 其他API地址
  otherUrl?: string
  // 是否使用海通官方获取OpenId方式
  wxOpenIdUseHkrt?: boolean
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
export interface HkrtSubConfig extends MchEntity {
  // 商户编号
  merchNo?: string
  // SAAS终端号
  pn?: string
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
