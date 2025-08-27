import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { ChannelTerminal } from '@/views/daxpay/common/device/terminal/channel/ChannelTerminal.api'

/**
 * 获取
 */
export function get(id) {
  return defHttp.get<Result<HkrtTerminal>>({
    url: '/hkrt/terminal/findById',
    params: { id },
  })
}

/**
 * 更新
 */
export function update(params) {
  return defHttp.post<Result<void>>({
    url: '/hkrt/terminal/update',
    data: params,
  })
}

/**
 * 通道终端设备上报记录
 */
export interface HkrtTerminal extends ChannelTerminal {
  /** 终端型号代码 */
  code?: string
  /** 门店编号 */
  storeId?: string
  /** 海科系统序列号 */
  pn?: string
  /** 地址 */
  address?: string
}
