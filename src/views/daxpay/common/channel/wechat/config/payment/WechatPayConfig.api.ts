import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'
import { unref } from 'vue'
/**
 * 获取单条
 */
export function getConfig(id) {
  return defHttp.get<Result<WechatPayConfig>>({
    url: '/wechat/pay/config/findById',
    params: { id: unref(id) },
  })
}

/**
 * 保存或更新
 */
export function saveOrUpdate(obj: WechatPayConfig) {
  return defHttp.post({
    url: '/wechat/pay/config/saveOrUpdate',
    data: obj,
  })
}
/**
 * 获取单条特约商户
 */
export function getSubConfig(id) {
  return defHttp.get<Result<WechatPaySubConfig>>({
    url: '/wechat/pay/config/findSubById',
    params: { id: unref(id) },
  })
}

/**
 * 保存或更新特约商户
 */
export function saveOrUpdateSub(obj: WechatPaySubConfig) {
  return defHttp.post({
    url: '/wechat/pay/config/saveOrUpdateSub',
    data: obj,
  })
}

/**
 * 微信支付配置
 */
export interface WechatPayConfig extends MchEntity {
  // 微信应用AppId
  wxAppId?: string
  // 微信商户号
  wxMchId?: string
  // 微信子应用AppId
  subAppId?: string
  // 微信子商户号
  subMchId?: string
  // 是否特约商户
  isv?: boolean
  // 是否启用
  enable: boolean
  // 授权类型
  authType?: string
  // 授权认证地址
  authUrl?: string
  // 支付限额
  limitAmount?: number
  // API 版本
  apiVersion: string
  // 商户平台「API安全」中的 APIv2 密钥
  apiKeyV2?: string
  // 商户平台「API安全」中的 APIv3 密钥
  apiKeyV3?: string
  // APPID对应的接口密码，用于获取接口调用凭证access_token时使用
  appSecret?: string
  // 支付公钥
  publicKey?: string
  // 支付公钥ID
  publicKeyId?: string
  // 商户API证书
  privateCert?: string
  // 商户API证书私钥
  privateKey?: string
  // 商户API证书序列号
  certSerialNo?: string
  // p12的文件
  p12?: string | null
  // 应用域名，回调中会使用此参数
  domain?: string
  // 授权回调地址
  redirectUrl?: string
  // 服务器异步通知页面路径
  notifyUrl?: string
  // 页面跳转同步通知页面路径
  returnUrl?: string
  // 备注
  remark?: string
}

/**
 * 特约商户服务商配置
 */
export interface WechatPaySubConfig extends MchEntity {
  // 子商户商户号
  subMchId?: string
  // 授权类型
  authType?: string
  // 子商户应用AppId
  subAppId?: string
  // 微信AppSecret
  wxAppSecret?: string
  // 微信授权认证地址
  wxAuthUrl?: string
  // 是否启用
  enable?: boolean
  // 支付限额
  limitAmount?: number
}
