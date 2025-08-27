import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'

/**
 * 获取商户信息
 */
export function getShopInfo() {
  return defHttp.get<Result>({
    url: '/merchant/get',
  })
}

/**
 * 支付交易信息统计
 */
export function payTradeReport(params) {
  return defHttp.get<Result<TradeReportResult>>({
    url: '/merchant/report/index/pay',
    params,
  })
}

/**
 * 退款交易信息统计
 */
export function rfdTradeReport(params) {
  return defHttp.get<Result<TradeReportResult>>({
    url: '/merchant/report/index/refund',
    params,
  })
}

/**
 * 支付交易通道统计
 */
export function payChannelReport(params) {
  return defHttp.get<Result<TradeReportResult[]>>({
    url: '/merchant/report/index/payChannel',
    params,
  })
}

/**
 * 退款交易通道统计
 */
export function refundChannelReport(params) {
  return defHttp.get<Result<TradeReportResult[]>>({
    url: '/merchant/report/index/refundChannel',
    params,
  })
}

/**
 * 支付方式统计
 */
export function payMethodReport(params) {
  return defHttp.get<Result<TradeReportResult[]>>({
    url: '/merchant/report/index/payMethod',
    params,
  })
}

/**
 * 交易统计报表
 */
export function tradeStatisticsReport(params) {
  return defHttp.get<Result<TradeStatisticsReport[]>>({
    url: '/merchant/report/index/tradeStatisticsReport',
    params,
  })
}

/**
 * 交易报表
 */
export interface TradeReportResult {
  /** 标题 */
  title?: string

  /** 交易金额 */
  tradeAmount?: number

  /** 交易笔数 */
  tradeCount?: number

  /** 最大单笔金额 */
  maxAmount?: number

  /** 平均单笔金额 */
  avgAmount?: number
}

/**
 * 交易统计报表
 */
export interface TradeStatisticsReport {
  /** 日期 */
  date?: string
  /** 交易金额 */
  payAmount?: number
  /** 交易笔数 */
  payCount?: number
  /** 退款金额 */
  refundAmount?: number
  /** 退款笔数 */
  refundCount?: number
}
