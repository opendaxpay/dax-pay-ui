import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'
import { BaseEntity } from '#/web'

/**
 * 分页
 */
export function page(params) {
  return defHttp.get<Result<PageResult<UserInfo>>>({
    url: '/user/admin/page',
    params,
  })
}

/**
 * 获取单条
 */
export function get(id) {
  return defHttp.get<Result<UserInfo>>({
    url: '/user/admin/findById',
    params: { id },
  })
}

/**
 * 添加
 */
export function add(obj) {
  return defHttp.post({
    url: '/user/admin/add',
    data: obj,
  })
}

/**
 * 更新
 */
export function update(obj) {
  return defHttp.post({
    url: '/user/admin/update',
    data: obj,
  })
}

/**
 * 查询全部
 */
export function findAll() {
  return defHttp.get<Result<Array<UserInfo>>>({
    url: '/user/admin/findAll',
  })
}
/**
 * 重置密码
 */
export function restartPassword(userId, newPassword) {
  return defHttp.post({
    url: '/user/admin/restartPassword',
    data: { userId, newPassword },
  })
}

/**
 * 批量重置密码
 */
export function restartPasswordBatch(userIds, newPassword) {
  return defHttp.post({
    url: '/user/admin/restartPasswordBatch',
    data: { userIds, newPassword },
  })
}

/**
 * 封禁用户
 */
export function banUser(userId) {
  return defHttp.post({
    url: '/user/admin/ban',
    params: { userId },
  })
}

/**
 * 封禁用户 批量
 */
export function banUserBatch(userIds) {
  return defHttp.post({
    url: '/user/admin/banBatch',
    data: userIds,
  })
}

/**
 * 解锁用户
 */
export function unlockUser(userId) {
  return defHttp.post({
    url: '/user/admin/unlock',
    params: { userId },
  })
}

/**
 * 批量解锁用户
 */
export function unlockUserBatch(userIds) {
  return defHttp.post({
    url: '/user/admin/unlockBatch',
    data: userIds,
  })
}

/**
 * 用户信息
 */
export interface UserInfo extends BaseEntity {
  // 名称
  name: string
  // 账号
  account: string
  // 密码
  password?: string
  // 确认密码
  confirmPassword?: string
  // 手机号
  phone?: string
  // 邮箱
  email?: string
  // 是否超级管理员
  administrator?: boolean
  // 注册时间
  registerTime?: string
  // 账号状态
  status?: number
}
