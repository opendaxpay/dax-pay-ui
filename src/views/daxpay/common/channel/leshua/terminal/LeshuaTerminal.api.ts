import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { ChannelTerminal } from '@/views/daxpay/common/device/terminal/channel/ChannelTerminal.api'

/**
 * 获取
 */
export function get(id) {
  return defHttp.get<Result<LeshuaTerminal>>({
    url: '/leshua/terminal/findById',
    params: { id },
  })
}

/**
 * 更新
 */
export function update(params) {
  return defHttp.post<Result<void>>({
    url: '/leshua/terminal/update',
    data: params,
  })
}

/**
 * 通道终端设备上报记录
 */
export interface LeshuaTerminal extends ChannelTerminal {
  /** 新设备类型 */
  newTerminalType?: string
  /** 终端厂商名称 */
  industryName?: string
  /** 终端型号 */
  industryModel?: string
  /** 乐刷终端编号 */
  deviceId?: string
  /** 终端序列号 */
  serialNum?: string
}
