import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { LabeledValue } from 'ant-design-vue/lib/select'

/**
 * 商户下拉列表
 */
export function dropdown() {
  return defHttp.get<Result<LabeledValue[]>>({
    url: '/merchant/query/dropdown',
  })
}
/**
 * 启用的商户下拉列表
 */
export function dropdownByEnable() {
  return defHttp.get<Result<LabeledValue[]>>({
    url: '/merchant/query/dropdownByEnable',
  })
}
