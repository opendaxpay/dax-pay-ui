import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { Merchant } from '@/views/daxpay/admin/merchant/info/Merchant.api'

/**
 * 获取商户信息
 */
export const get = () => {
  return defHttp.get<Result<Merchant>>({
    url: '/merchant/get',
  })
}

/**
 * 更新
 */
export const update = (data: Merchant) => {
  return defHttp.post<Result<Merchant>>({
    url: '/merchant/update',
    data,
  })
}
