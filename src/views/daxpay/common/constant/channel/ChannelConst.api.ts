import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'
import { BaseEntity } from '#/web'
import { LabeledValue } from 'ant-design-vue/lib/select'

/**
 * 分页
 */
export const page = (params) => {
  return defHttp.get<Result<PageResult<ChannelConst>>>({
    url: '/const/channel/page',
    params,
  })
}

/**
 * 服务商通道配置列表
 */
export const dropdownByIsv = () => {
  return defHttp.get<Result<LabeledValue[]>>({
    url: '/const/channel/dropdownByIsv',
  })
}


export interface ChannelConst extends BaseEntity {
  /** 编码 */
  code?: string
  /** 名称 */
  name?: string
  /** 是否启用 */
  enable?: boolean
  /** 备注 */
  remark?: string
  /** 是否支持服务商 */
  isv?: boolean
  /** 是否支持分账 */
  allocatable?: boolean
  /** 是否支持支付终端报送 */
  terminal?: boolean

}
