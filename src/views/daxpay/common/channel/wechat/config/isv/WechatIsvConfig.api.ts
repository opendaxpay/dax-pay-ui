import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'
import { unref } from 'vue'
/**
 * 获取单条
 */
export function getConfig(id) {
  return defHttp.get<Result<WechatPayConfig>>({
    url: '/isv/wechat/config/findById',
    params: { id: unref(id) },
  })
}

/**
 * 保存或更新
 */
export function saveOrUpdate(obj: WechatPayConfig) {
  return defHttp.post({
    url: '/isv/wechat/config/saveOrUpdate',
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
  // 是否启用
  enable: boolean
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
  // 私钥Key
  privateKey?: string
  // 私钥证书
  privateCert?: string
  // 证书序列号
  certSerialNo?: string
  // p12的文件id
  p12?: string | null
  // 应用域名，回调中会使用此参数
  domain?: string
  // 授权回调地址
  redirectUrl?: string
  // 服务器异步通知页面路径
  notifyUrl?: string
  // 页面跳转同步通知页面路径
  returnUrl?: string
  // 微信授权认证地址
  authUrl?: string
  // 服务商号
  isvNo?: string
}
