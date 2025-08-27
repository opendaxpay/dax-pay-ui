import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { ChannelTerminal } from '@/views/daxpay/common/device/terminal/channel/ChannelTerminal.api'

/**
 * 获取
 */
export function get(id) {
  return defHttp.get<Result<AdaPayTerminal>>({
    url: '/adapay/terminal/findById',
    params: { id },
  })
}

/**
 * 更新
 */
export function update(params) {
  return defHttp.post<Result<void>>({
    url: '/adapay/terminal/update',
    data: params,
  })
}

/**
 * 通道终端设备上报记录
 */
export interface AdaPayTerminal extends ChannelTerminal {
  /** 费率类型 */
  feeType?: string
}
