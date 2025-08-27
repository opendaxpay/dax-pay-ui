import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { ChannelTerminal } from '@/views/daxpay/common/device/terminal/channel/ChannelTerminal.api'

/**
 * 获取
 */
export function get(id) {
  return defHttp.get<Result<VbillTerminal>>({
    url: '/vbill/terminal/findById',
    params: { id },
  })
}

/**
 * 更新
 */
export function update(params) {
  return defHttp.post<Result<void>>({
    url: '/vbill/terminal/update',
    data: params,
  })
}

/**
 * 通道终端设备上报记录
 */
export interface VbillTerminal extends ChannelTerminal {
  /** 门店编号 */
  storeId?: string
  /** 设备别名 */
  devicesName?: string
  /** 设备归属 0 第三方终端 1 天阙入网终端 */
  belongTo?: string
  /** 设备型号 */
  modelNo?: string
  /** 设备SN 非TH型号必传（传完整的TUSN） */
  serialNo?: string
  /** 终端号 */
  deviceNo?: string
  /** 银联活动终端号 */
  ylTrmNo?: string
}
