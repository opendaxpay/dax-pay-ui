import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'

/**
 * 支付参数签名
 */
export function paySign(param: PayParam) {
  return defHttp.post<Result<string>>({ url: '/develop/trade/sign/pay', data: param })
}

/**
 * 支付
 */
export function tradePay(params) {
  return defHttp.post<Result<PayResult>>({ url: '/develop/trade/pay', data: params })
}

/**
 * 退款参数签名
 */
export function refundSign(param: RefundParam) {
  return defHttp.post<Result<string>>({ url: '/develop/trade/sign/refund', data: param })
}

/**
 * 退款
 */
export function tradeRefund(params) {
  return defHttp.post<Result<RefundResult>>({ url: '/develop/trade/refund', data: params })
}

/**
 * 转账签名
 */
export function transferSign(param: TransferParam) {
  return defHttp.post<Result<string>>({ url: '/develop/trade/sign/transfer', data: param })
}

/**
 * 转账
 */
export function tradeTransfer(params) {
  return defHttp.post<Result<TransferResult>>({ url: '/develop/trade/transfer', data: params })
}

/**
 * 创建收银台链接签名
 */
export function gatewaySign(param: GatewayPayParam) {
  return defHttp.post<Result<string>>({ url: '/develop/trade/sign/gateway', data: param })
}

/**
 * 创建收银台链接
 */
export function gateway(params) {
  return defHttp.post<Result<CheckoutUrlResult>>({ url: '/develop/trade/gateway', data: params })
}

/**
 * 支付请求参数
 */
export interface PayParam {
  /** 商户订单号 */
  bizOrderNo?: string
  /** 支付标题 */
  title?: string
  /** 支付描述 */
  description?: string
  /** 是否开启分账 */
  allocation?: boolean
  /** 自动分账 */
  autoAllocation?: boolean
  /** 限制用户支付类型 */
  limitPay?: string
  /** 过期时间 */
  expiredTime?: string
  /** 支付通道编码 */
  channel?: string
  /** 支付方式编码 */
  method?: string
  /** 其他支付方式编码 */
  otherMethod?: string
  /** 支付金额 */
  amount?: number
  /** 付款码 */
  authCode?: string
  /** 终端设备编码 */
  terminalNo?: string
  /** openId */
  openId?: string
  /** 支付扩展参数 */
  extraParam?: string
  /** 商户扩展参数 */
  attach?: string
  /** 同步跳转地址 */
  returnUrl?: string
  /** 用户付款中途退出返回商户网站的地址 */
  quitUrl?: string
  /** 异步通知地址 */
  notifyUrl?: string
  /** 终端IP */
  clientIp?: string
  /** 商户号 */
  mchNo?: string
  /** 应用号 */
  appId?: string
  /** 随机数 */
  nonceStr?: string
  /** 签名 */
  sign?: string
  /** 请求时间 */
  reqTime?: string
}

/**
 * 支付返回结果
 */
export interface PayResult {
  /** 商户订单号 */
  bizOrderNo?: string
  /** 订单号 */
  orderNo?: string
  /** 支付状态 */
  status?: string
  /** 支付参数体 */
  payBody?: string
  /** 商户号 */
  mchNo?: string
  /** 应用号 */
  appId?: string
  /** 随机数 */
  nonceStr?: string
  /** 签名 */
  sign?: string
}

/**
 * 退款请求参数
 */
export interface RefundParam {
  /** 商户退款号 */
  bizRefundNo?: string
  /** 支付订单号 */
  orderNo?: string
  /** 商户订单号 */
  bizOrderNo?: string
  /** 退款金额 */
  amount?: number
  /** 退款原因 */
  reason?: string
  /** 退款扩展参数 */
  extraParam?: string
  /** 商户扩展参数 */
  attach?: string
  /** 异步通知地址 */
  notifyUrl?: string
  /** 终端IP */
  clientIp?: string
  /** 商户号 */
  mchNo?: string
  /** 应用号 */
  appId?: string
  /** 随机数 */
  nonceStr?: string
  /** 签名 */
  sign?: string
  /** 请求时间 */
  reqTime?: string
}

/**
 * 退款返回结果
 */
export interface RefundResult {
  /** 退款号 */
  refundNo?: string
  /** 商户退款号 */
  bizRefundNo?: string
  /** 退款状态 */
  status?: string
  /** 商户号 */
  mchNo?: string
  /** 应用号 */
  appId?: string
  /** 随机数 */
  nonceStr?: string
  /** 签名 */
  sign?: string
}

/**
 * 转账请求参数
 */
export interface TransferParam {
  /** 商户转账号 */
  bizTransferNo?: string
  /** 支付通道 */
  channel?: string
  /** 转账金额 */
  amount?: number
  /** 标题 */
  title?: string
  /** 转账原因 */
  reason?: string
  /** 收款人账号类型 */
  payeeType?: string
  /** 收款人账号 */
  payeeAccount?: string
  /** 收款人姓名 */
  payeeName?: string
  /** 转账扩展参数 */
  extraParam?: string
  /** 商户扩展参数 */
  attach?: string
  /** 异步通知地址 */
  notifyUrl?: string
  /** 终端IP */
  clientIp?: string
  /** 商户号 */
  mchNo?: string
  /** 应用号 */
  appId?: string
  /** 随机数 */
  nonceStr?: string
  /** 签名 */
  sign?: string
  /** 请求时间 */
  reqTime?: string
}
/**
 * 转账返回结果
 */
export interface TransferResult {
  /** 商户转账号 */
  bizTransferNo?: string
  /** 转账号 */
  transferNo?: string
  /** 状态 */
  status?: string
  /** 提示信息 */
  errorMsg?: string
  /** 商户号 */
  mchNo?: string
  /** 应用号 */
  appId?: string
  /** 随机数 */
  nonceStr?: string
  /** 签名 */
  sign?: string
}

/**
 * 收银台支付参数
 */
export interface GatewayPayParam {
  /** 收银台类型 */
  gatewayPayType?: string
  /** 商户订单号 */
  bizOrderNo?: string
  /** 支付标题 */
  title?: string
  /** 支付描述 */
  description?: string
  /** 是否开启分账 */
  allocation?: boolean
  /** 自动分账 */
  autoAllocation?: boolean
  /** 限制用户支付类型 */
  limitPay?: string
  /** 过期时间 */
  expiredTime?: string
  /** 支付通道编码 */
  channel?: string
  /** 支付方式编码 */
  method?: string
  /** 支付金额 */
  amount?: number
  /** 支付扩展参数 */
  extraParam?: string
  /** 商户扩展参数 */
  attach?: string
  /** 同步跳转地址 */
  returnUrl?: string
  /** 用户付款中途退出返回商户网站的地址 */
  quitUrl?: string
  /** 异步通知地址 */
  notifyUrl?: string
  /** 终端IP */
  clientIp?: string
  /** 商户号 */
  mchNo?: string
  /** 应用号 */
  appId?: string
  /** 随机数 */
  nonceStr?: string
  /** 签名 */
  sign?: string
  /** 请求时间 */
  reqTime?: string
}

/**
 * 收银台响应参数
 */
export interface CheckoutUrlResult {
  /** 收银台链接 */
  url?: string
}
