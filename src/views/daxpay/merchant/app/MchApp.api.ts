import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'
import { LabeledValue } from 'ant-design-vue/lib/select'
import { MchApp } from '@/views/daxpay/admin/merchant/app/MchAppAdmin.api'

/**
 * 分页
 */
export const page = (params) => {
  return defHttp.get<Result<PageResult<MchApp>>>({
    url: '/mch/app/page',
    params,
  })
}
/**
 * 详情
 */
export const get = (id) => {
  return defHttp.get<Result<MchApp>>({
    url: '/mch/app/findById',
    params: { id },
  })
}
/**
 * 新增
 */
export const add = (obj) => {
  return defHttp.post<Result<void>>({
    url: '/mch/app/add',
    data: obj,
  })
}
/**
 * 更新
 */
export const update = (obj) => {
  return defHttp.post<Result<void>>({
    url: '/mch/app/update',
    data: obj,
  })
}

/**
 * 删除
 */
export const del = (id) => {
  return defHttp.post<Result<void>>({
    url: '/mch/app/delete',
    params: { id },
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
