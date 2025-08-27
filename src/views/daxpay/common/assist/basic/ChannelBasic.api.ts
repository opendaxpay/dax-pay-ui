import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { LabeledValue } from 'ant-design-vue/lib/select'

/**
 * 查询支付通道下属的支付方式列表
 */
export function payMethodList(channel: string) {
  return defHttp.get<Result<LabeledValue[]>>({
    url: '/channel/basic/payMethodList',
    params: { channel },
  })
}
