import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'
import { MchEntity } from '#/web'
import { TransferStatusEnum } from '@/enums/daxpay/tradeStatusEnum'

/**
 * 分页
 */
export function page(params) {
  return defHttp.get<Result<PageResult<TransferOrder>>>({
    url: '/order/transfer/page',
    params,
  })
}

/**
 * 获取单条
 */
export function get(id) {
  return defHttp.get<Result<TransferOrder>>({
    url: '/order/transfer/findById',
    params: { id },
  })
}

/**
 * 获取单条
 */
export function findByTransferNo(transferNo) {
  return defHttp.get<Result<TransferOrder>>({
    url: '/order/transfer/findByTransferNo',
    params: { transferNo },
  })
}

/**
 * 发起转账
 */
export function transfer(params) {
  return defHttp.post<Result<void>>({
    url: '/order/transfer/transfer',
    data: params,
  })
}

/**
 * 转账信息同步
 */
export function syncByTransferId(id) {
  return defHttp.post<Result<void>>({
    url: '/order/transfer/sync',
    params: { id },
  })
}

/**
 * 转账重试
 */
export function retryTransfer(id) {
  return defHttp.post<Result<void>>({
    url: '/order/transfer/retry',
    params: { id },
  })
}

/**
 * 关闭转账订单
 */
export function closeTransfer(id) {
  return defHttp.post<Result<void>>({
    url: '/order/transfer/close',
    params: { id },
  })
}

/**
 * 获取汇总金额
 */
export function getTotalAmount(param) {
  return defHttp.get<Result<number>>({
    url: '/order/transfer/getTotalAmount',
    params: param,
  })
}

/**
 * 显示样式优化
 */
export function cellStyle({ row, column }) {
  if (column.field == 'status') {
    if (row.status == TransferStatusEnum.SUCCESS) {
      return { color: 'green' }
    }
    if (row.status == TransferStatusEnum.FAIL) {
      return { color: 'red' }
    }
    if (row.status == TransferStatusEnum.PROGRESS) {
      return { color: 'orange' }
    }
    if (row.status == TransferStatusEnum.CLOSE) {
      return { color: 'gray' }
    }
  }
}

/**
 * 转账记录
 */
export interface TransferOrder extends MchEntity {
  // 商户转账号
  bizTransferNo?: string
  // 转账号
  transferNo?: string
  // 通道转账号
  outTransferNo?: string
  // 通道
  channel?: string
  // 转账金额
  amount?: number
  // 标题
  title?: string
  // 转账原因/备注
  reason?: string
  // 转账类型, 微信使用
  transferType?: string
  // 付款方
  payer?: string
  // 收款人账号
  payeeAccount?: string
  // 收款人姓名
  payeeName?: string
  // 状态
  status?: string
  // 完成时间
  finishTime?: string
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
