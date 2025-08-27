import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { BaseEntity } from '#/web'

/**
 * 查询列表
 */
export function findAll() {
  return defHttp.get<Result<FilePlatform[]>>({
    url: '/file/platform/findAll',
  })
}

/**
 * 更新文件存储平台地址
 */
export function updateUrl(id: string, url: string) {
  return defHttp.post<Result<FilePlatform>>({
    url: '/file/platform/updateUrl',
    data: { id, url },
  })
}

/**
 * 设置默认存储平台地址
 */
export function setDefault(id: string) {
  return defHttp.post<Result<FilePlatform>>({
    url: '/file/platform/setDefault',
    params: { id },
  })
}

/**
 * 获取默认上传平台
 */
export function getDefaultUploadPlatform() {
  return defHttp.get<Result<string>>({
    url: '/file/platform/getDefaultUpload',
  })
}

/**
 * 文件存储平台
 */
export interface FilePlatform extends BaseEntity {
  /**
   * 文件存储平台名称
   */
  name: string
  /**
   * 文件存储平台类型
   */
  type: string
  /**
   * 访问地址
   */
  url?: string
  /**
   * 默认平台
   */
  defaultPlatform: boolean
  /**
   * 前端直传
   */
  frontendUpload: boolean
}
