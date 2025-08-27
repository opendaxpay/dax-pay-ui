import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { LabeledValue } from 'ant-design-vue/lib/select'

/**
 * 查询应用下拉列表
 */
export function dropdown() {
  return defHttp.get<Result<LabeledValue[]>>({
    url: '/mch/app/query/dropdown',
  })
}

/**
 * 查询启应用下拉列表
 */
export function dropdownByEnable() {
  return defHttp.get<Result<LabeledValue[]>>({
    url: '/mch/app/query/dropdownByEnable',
  })
}

/**
 * 根据商户号查询应用下拉列表
 */
export function dropdownByMchNo(mchNo) {
  return defHttp.get<Result<LabeledValue[]>>({
    url: '/mch/app/query/dropdownByMchNo',
    params: { mchNo },
  })
}

/**
 * 根据商户号查询启应用下拉列表
 */
export function dropdownEnableByMchNo(mchNo) {
  return defHttp.get<Result<LabeledValue[]>>({
    url: '/mch/app/query/dropdownEnableByMchNo',
    params: { mchNo },
  })
}
