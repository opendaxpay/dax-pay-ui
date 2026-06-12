import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 平台文件 API
 */
export const PlatformFileApi = {
  /**
   * 分页查询
   */
  page(params: PlatformFilePageParam): Promise<Result<PageResult<PlatformFile>>> {
    return defHttp.get({ url: '/file/platform/record/page', params });
  },

  /**
   * 查询详情
   */
  findById(id: string): Promise<Result<PlatformFile>> {
    return defHttp.get({ url: `/file/platform/record/${id}` });
  },
};

/**
 * 平台文件分页查询参数
 */
export interface PlatformFilePageParam {
  /** 当前页 */
  current?: number;
  /** 每页条数 */
  size?: number;
  /** 文件名称 */
  filename?: string;
  /** 原始文件名 */
  originalFilename?: string;
  /** 文件扩展名 */
  ext?: string;
  /** 访问类型 */
  accessType?: string;
  /** 业务分类 */
  bizType?: string;
}

/**
 * 平台文件
 */
export interface PlatformFile extends BaseEntity {
  /** 文件访问地址 */
  url?: string;
  /** 文件大小，单位字节 */
  size?: number;
  /** 文件名称 */
  filename?: string;
  /** 原始文件名 */
  originalFilename?: string;
  /** 基础存储路径 */
  basePath?: string;
  /** 存储路径 */
  path?: string;
  /** 文件扩展名 */
  ext?: string;
  /** MIME类型 */
  contentType?: string;
  /** 访问类型 */
  accessType?: string;
  /** 业务分类 */
  bizType?: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createTime?: string;
}
