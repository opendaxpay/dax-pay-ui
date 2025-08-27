import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'
import { unref } from 'vue'

/**
 * 获取单条
 */
export function getConfig(id) {
  return defHttp.get<Result<AlipayConfig>>({
    url: '/isv/alipay/config/findById',
    params: { id: unref(id) },
  })
}

/**
 * 保存或更新
 */
export function saveOrUpdate(obj: AlipayConfig) {
  return defHttp.post({
    url: '/isv/alipay/config/saveOrUpdate',
    data: obj,
  })
}

/**
 * 支付宝配置
 */
export interface AlipayConfig extends MchEntity {
  // 支付宝商户appId
  aliAppId?: string
  // 是否启用
  enable: boolean
  // 商户账号ID
  alipayUserId?: string
  // 授权回调地址
  redirectUrl?: string
  // 服务器异步通知页面路径
  notifyUrl?: string
  // 页面跳转同步通知页面路径
  returnUrl?: string
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
  // 服务商号
  isvNo?: string
}
