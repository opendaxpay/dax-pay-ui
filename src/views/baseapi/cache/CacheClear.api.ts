import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'

/**
 * 查询所有缓存前缀
 */
export function getCachePrefix() {
  return defHttp.get<Result<string[]>>({ url: '/cache/clear/getCachePrefix' })
}

/**
 * 清除指定前缀的缓存
 */
export function clearCacheByPrefix(params) {
  return defHttp.post<Result<void>>({ url: '/cache/clear/prefix', data: params })
}
