import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'
import { unref } from 'vue'
import { LabeledValue } from 'ant-design-vue/lib/select'

/**
 * 列表
 */
export function findAll(appId) {
  return defHttp.get<Result<ChannelConfig[]>>({
    url: '/channel/config/findAllByAppId',
    params: {
      appId: unref(appId),
    },
  })
}

/**
 * 根据应用AppId获取启用的通道
 */
export function dropdownByEnable(appId) {
  return defHttp.get<Result<LabeledValue[]>>({
    url: '/channel/config/dropdownByEnable',
    params: { appId },
  })
}

/**
 * 支付通道配置
 */
export interface ChannelConfig extends MchEntity {
  channel?: string
  // 通道名称
  name?: string
  // 是否为特约商户
  sub?: boolean
  // 是否启用
  enable?: boolean
  // 通道商户号
  outMchNo?: string
  // 通道APPID
  outAppId?: string

}
