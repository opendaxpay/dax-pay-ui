import { defHttp } from '@/utils/http/axios'
import { GetUserInfoModel } from './model/userModel'
import { Result } from '#/axios'

/**
 * 登录后获取用户信息
 */
export function getUserInfo() {
  return defHttp.get<Result<GetUserInfoModel>>({ url: '/user/getLoginAfterUserInfo' })
}

/**
 * 注册
 */
export function register(obj) {
  return defHttp.post({
    url: `/user/register`,
    data: obj,
  })
}

/**
 * 重置密码
 */
export function forgetPasswordByPhone(obj) {
  return defHttp.post({
    url: `/user/forgetPasswordByPhone`,
    data: obj,
  })
}
/**
 * 修改密码
 */
export function modifPassword(obj) {
  return defHttp.post({
    url: `/user/updatePassword`,
    params: obj,
  })
}
