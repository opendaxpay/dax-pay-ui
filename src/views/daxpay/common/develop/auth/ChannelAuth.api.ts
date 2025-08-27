import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'

/**
 * 获取授权链接
 */
export function generateAuthUrl(params: GenerateAuthUrlParam) {
  return defHttp.post<Result<AuthUrlResult>>({
    url: '/assist/channel/auth/generateAuthUrl',
    data: params,
  })
}

/**
 * 通过查询码获取认证结果
 */
export function queryAuthResult(queryCode) {
  return defHttp.get<Result<AuthResult>>({
    url: '/assist/channel/auth/queryAuthResult',
    params: {
      queryCode,
    },
  })
}

/**
 * 授权链接和查询标识返回类
 */
export interface AuthUrlResult {
  // 授权链接
  authUrl?: string
  // 查询标识
  queryCode?: boolean
}

/**
 * 生成授权链接参数
 */
export interface GenerateAuthUrlParam extends MchEntity {
  // 通道
  channel?: string
  // 认证类型
  authType?: string
  // 授权认证路径
  authPath?: string
}

/**
 * 认证结果
 */
export interface AuthResult {
  // OpenId
  openId?: string
  // 用户ID
  userId?: string
  // AccessToken
  accessToken?: string
  // 状态
  status?: string
}
