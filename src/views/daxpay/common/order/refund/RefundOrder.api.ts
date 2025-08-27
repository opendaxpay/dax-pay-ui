import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'
import { MchEntity } from '#/web'
import {
  PayAllocStatusEnum,
  PayRefundStatusEnum,
  PayStatusEnum,
  RefundStatusEnum,
} from '@/enums/daxpay/tradeStatusEnum'

/**
 * 分页
 */
export function page(params) {
  return defHttp.get<Result<PageResult<RefundOrder>>>({
    url: '/order/refund/page',
    params,
  })
}

/**
 * 获取单条
 */
export function get(id) {
  return defHttp.get<Result<RefundOrder>>({
    url: '/order/refund/findById',
    params: { id },
  })
}

/**
 * 获取单条
 */
export function getByRefundNo(refundNo) {
  return defHttp.get<Result<any>>({
    url: '/order/refund/findByRefundNo',
    params: { refundNo },
  })
}

/**
 * 发起退款
 */
export function refund(params) {
  return defHttp.post<Result<void>>({
    url: '/order/refund/create',
    data: params,
  })
}

/**
 * 退款信息同步
 */
export function syncOrder(id) {
  return defHttp.post<Result<void>>({
    url: '/order/refund/sync',
    params: { id },
  })
}

/**
 * 退款重试
 */
export function retryRefund(id) {
  return defHttp.post<Result<void>>({
    url: '/order/refund/retry',
    params: { id },
  })
}

/**
 * 退款关闭
 */
export function closeRefund(id) {
  return defHttp.post<Result<void>>({
    url: '/order/refund/close',
    params: { id },
  })
}

/**
 * 获取汇总金额
 */
export function getTotalAmount(param) {
  return defHttp.get<Result<number>>({
    url: '/order/refund/getTotalAmount',
    params: param,
  })
}

/**
 * 显示样式优化
 */
export function cellStyle({ row, column }) {
  // 支付状态
  if (column.field == 'status') {
    if (row.status == RefundStatusEnum.SUCCESS) {
      return { color: 'green' }
    }
    if (row.status == RefundStatusEnum.FAIL) {
      return { color: 'red' }
    }
    if (row.status == RefundStatusEnum.PROGRESS) {
      return { color: 'orange' }
    }
    if (row.status == RefundStatusEnum.CLOSE) {
      return { color: 'gray' }
    }
  }
}

/**
 * 退款记录
 */
export interface RefundOrder extends MchEntity {
  // 支付订单ID
  orderId?: string
  // 支付订单号
  orderNo?: string
  // 商户支付订单号
  bizOrderNo?: string
  // 支付标题
  title?: string
  // 退款号
  refundNo?: string
  // 商户退款号
  bizRefundNo?: string
  // 通道退款号
  outRefundNo?: string
  // 订单金额
  orderAmount?: number
  // 退款金额
  amount?: number
  // 退款通道
  channel?: string
  // 退款状态
  status?: string
  // 结算状态
  settleStatus?: string
  // 退款结束时间
  finishTime?: string
  // 退款原因
  reason?: string
  // 异步通知地址
  notifyUrl?: string
  // 商户扩展参数
  attach?: string
  // 附加参数
  extraParam?: string
  // 请求时间
  reqTime?: string
  // 支付终端ip
  clientIp?: string
  // 错误码
  errorCode?: string
  // 错误信息
  errorMsg?: string
}
