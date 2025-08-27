import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'
import { UserInfo } from '@/views/iam/user/User.api'
import { MchEntity } from '#/web'

/**
 * 用户列表
 */
export function page(params) {
  return defHttp.get<Result<PageResult<MerchantUserInfo[]>>>({
    url: '/merchant/user/page',
    params,
  })
}

/**
 * 用户详情
 */
export function get(id) {
  return defHttp.get<Result<MerchantUserInfo>>({
    url: '/merchant/user/findById',
    params: { id },
  })
}

/**
 * 修改用户
 */
export function update(params) {
  return defHttp.post<Result>({
    url: '/merchant/user/update',
    data: params,
  })
}

/**
 * 重置密码
 */
export function restartPassword(userId, newPassword) {
  return defHttp.post({
    url: '/merchant/user/restartPassword',
    data: { userId, newPassword },
  })
}

/**
 * 批量重置密码
 */
export function restartPasswordBatch(userIds, newPassword) {
  return defHttp.post({
    url: '/merchant/user/restartPasswordBatch',
    data: { userIds, newPassword },
  })
}

/**
 * 封禁用户
 */
export function banUser(userId) {
  return defHttp.post({
    url: '/merchant/user/ban',
    params: { userId },
  })
}

/**
 * 封禁用户 批量
 */
export function banUserBatch(userIds) {
  return defHttp.post({
    url: '/merchant/user/banBatch',
    data: userIds,
  })
}

/**
 * 解锁用户
 */
export function unlockUser(userId) {
  return defHttp.post({
    url: '/merchant/user/unlock',
    params: { userId },
  })
}

/**
 * 解锁用户
 */
export function unlockUserBatch(userIds) {
  return defHttp.post({
    url: '/merchant/user/unlockBatch',
    data: userIds,
  })
}

/**
 * 商户用户信息
 */
export interface MerchantUserInfo extends UserInfo, MchEntity {}
