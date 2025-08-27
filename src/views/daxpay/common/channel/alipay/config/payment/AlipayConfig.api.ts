import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'
import { unref } from 'vue'

/**
 * 获取单条
 */
export function getConfig(id) {
  return defHttp.get<Result<AlipayConfig>>({
    url: '/alipay/config/findById',
    params: { id: unref(id) },
  })
}

/**
 * 保存或更新
 */
export function saveOrUpdate(obj: AlipayConfig) {
  return defHttp.post({
    url: '/alipay/config/saveOrUpdate',
    data: obj,
  })
}

/**
 * 获取单条特约商户
 */
export function getSubConfig(id) {
  return defHttp.get<Result<AlipaySubConfig>>({
    url: '/alipay/config/findSubById',
    params: { id: unref(id) },
  })
}

/**
 * 保存或更新特约商户
 */
export function saveOrUpdateSub(obj: AlipaySubConfig) {
  return defHttp.post({
    url: '/alipay/config/saveOrUpdateSub',
    data: obj,
  })
}

/**
 * 支付宝配置
 */
export interface AlipayConfig extends MchEntity {
  // 商户AppId
  appId?: string
  // 支付宝商户appId
  aliAppId?: string
  // 是否启用
  enable: boolean
  // 支付限额
  limitAmount?: number
  // 是否为特约商户
  isv?: boolean
  // 特约商户Token
  appAuthToken?: string
  // 商户账号ID
  alipayUserId?: string
  // 认证方式
  authType?: string
  // 签名类型
  signType?: string
  // 支付宝公钥
  alipayPublicKey?: string
  // 应用私钥
  privateKey?: string
  // 应用公钥
  appCert?: string
  // 支付宝公钥证书
  alipayCert?: string
  // 支付宝CA根证书
  alipayRootCert?: string
  // 是否沙箱环境
  sandbox?: boolean
}

/**
 * 子商户服务商配置
 */
export interface AlipaySubConfig extends MchEntity {
  // 服务商号
  isvNo?: string
  // 应用授权Token
  appAuthToken?: string
  // 是否启用
  enable: boolean
  // 商户账号ID
  alipayUserId?: string
  // 支付限额
  limitAmount?: number
}
